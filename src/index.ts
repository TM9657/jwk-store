import { Hono } from 'hono'
import {hash, compare} from "bcryptjs"
import { generateKeyPair, exportJWK } from 'jose'
import { Bindings, JWK } from './index.types'
import { getStoredJWKString, validation, base64ToArrayBuffer } from './util'

const app = new Hono<{ Bindings: Bindings }>()

app.use('/secure/*', async (c, next) => {
    const api_key = c.env.API_KEY;
    const api_key_header = c.req.header('authorization');
    if (api_key_header !== api_key) {
        return c.text('Unauthorized', 401)
    }
    await next()
})

app.post("/secure/:id", validation, async (c) => {
  const password = c.req.valid("json").password;
  const hashedPassword = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password)
  );
  const hashedPasswordKey = await crypto.subtle.importKey(
    "raw",
    hashedPassword,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );
  const id = encodeURIComponent(c.req.param("id"));
  const jwk = await getStoredJWKString(c.env.STORAGE, id);
  if (jwk) {
    try {
      const item: JWK = JSON.parse(jwk);
      const access = await compare(password, item.password);
      if (!access) {
        return c.text("Unauthorized", 401);
      }
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: base64ToArrayBuffer(item.iv) },
        hashedPasswordKey,
        base64ToArrayBuffer(item.private_jwk)
      );
      const parsed_decrypted = JSON.parse(new TextDecoder().decode(decrypted));
      return c.json(parsed_decrypted);
    } catch (error) {
      console.log(error);
      return c.text("Internal Server Error", 500);
    }
  }

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const newKeyPair = await generateKeyPair("ES512", {
    modulusLength: 4096,
    extractable: true,
  });

  const privateKey = await exportJWK(newKeyPair.privateKey);
  const publicKey = await exportJWK(newKeyPair.publicKey);

  const encryptedPrivateJWK = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    hashedPasswordKey,
    new TextEncoder().encode(JSON.stringify(privateKey))
  );

  const stored_object: JWK = {
    iv: btoa(String.fromCharCode(...iv)),
    password: await hash(password, 10),
    private_jwk: btoa(
      String.fromCharCode(...new Uint8Array(encryptedPrivateJWK))
    ),
  };

  await c.env.CDN_BUCKET.put(`jwk/${id}`, JSON.stringify(publicKey));
  await c.env.STORAGE.put(id, JSON.stringify(stored_object));
  return c.json(privateKey);
});

app.delete("/secure/:id", validation, async (c) => {
  const password = c.req.valid("json").password;
  const id = encodeURIComponent(c.req.param("id"));

  const jwk = await getStoredJWKString(c.env.STORAGE, id);
  if (!jwk) {
    return c.text("Ok", 200);
  }

  const item: JWK = JSON.parse(jwk);
  const access = await compare(password, item.password);
  if (!access) {
    return c.text("Unauthorized", 401);
  }

  await c.env.STORAGE.delete(id);
  await c.env.CDN_BUCKET.delete(`jwk/${id}`);
  return c.text("Ok", 200);
});

app.get("/secure/:id", validation, async (c) => {
  return c.text("Ok", 200);
});

app.get("/:jwk", async (c) => {
  const id = encodeURIComponent(c.req.param("jwk"));
  const public_address = c.env.BUCKET_PUBLIC_ADDRESS.endsWith("/")
    ? c.env.BUCKET_PUBLIC_ADDRESS
    : c.env.BUCKET_PUBLIC_ADDRESS + "/";
  c.redirect(`${public_address}jwk/${id}`);
});

app.get('/', async (c) => {
    return c.html('JWK token service, provided by <a href="https://tm9657.de">TM9657.de</a>', 200)
})

export default app

