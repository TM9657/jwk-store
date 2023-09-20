import { Hono } from 'hono'
import {hash, compare} from "bcryptjs"
import { generateKeyPair } from 'jose'
import { Bindings, JWK } from './index.types'
import { getStoredJWKString, validation } from './util'

const app = new Hono<{ Bindings: Bindings }>()

app.use('/secure/*', async (c, next) => {
    const api_key = c.env.API_KEY;
    const api_key_header = c.req.header('authorization');
    if (api_key_header !== api_key) {
        return c.text('Unauthorized', 401)
    }
    await next()
})

app.post('/secure/:keyId', validation, async (c) => {
    const password = c.req.valid('json').password;
    const hashedPassword = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
    const hashedPasswordKey = await crypto.subtle.importKey(
        "raw",
        hashedPassword,
        { name: "PBKDF2" },
        true,
        ["encrypt",
        "decrypt"]
    );
    const id = c.req.param('keyId')

    const jwk = await getStoredJWKString(c.env.STORAGE,id)
    if(jwk) {
        const item : JWK = JSON.parse(jwk);
        const access = await compare(password, item.password);
        if(!access) {
            return c.text('Unauthorized', 401)
        }
        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: item.iv }, hashedPasswordKey, item.private_jwk);
        const parsed_decrypted = JSON.parse(new TextDecoder().decode(decrypted));
        return c.json(parsed_decrypted)
    }
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const newKeyPair = await generateKeyPair("ES512");
    const encrypted_private_jwk = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        hashedPasswordKey,
        new TextEncoder().encode(JSON.stringify(newKeyPair.privateKey)),
      );
    const stored_object: JWK = {
        iv: iv,
        password: await hash(password, "jwk-store-tm9657"),
        public_jwk: newKeyPair.publicKey,
        private_jwk: encrypted_private_jwk,
    }
    await c.env.STORAGE.put(id, JSON.stringify(stored_object))
    return c.json(newKeyPair.privateKey)
})

app.delete('/secure/:keyId', validation, async (c) => {
    const password = c.req.valid('json').password;
    const id = c.req.param('keyId')

    const jwk = await getStoredJWKString(c.env.STORAGE,id)
    if(!jwk) {
        return c.text("Ok", 200)
    }

    const item : JWK = JSON.parse(jwk);
    const access = await compare(password, item.password);
    if(!access) {
        return c.text('Unauthorized', 401)
    }
    await c.env.STORAGE.delete(id)
    return c.text("Ok", 200)
})

app.get('/secure/:keyId', validation, async (c) => {
    return c.text("Ok", 200)
})

app.get('/:keyId', async (c) => {
    const id = c.req.param('keyId')

    const jwk = await getStoredJWKString(c.env.STORAGE,id)
    if(!jwk) {
        return c.text('Not Found', 404)
    }

    const parsedJWK : JWK = JSON.parse(jwk)
    return c.json(parsedJWK.public_jwk)
})

app.get('/', async (c) => {
    return c.html('JWK token service, provided by <a href="https://tm9657.de">TM9657.de</a>', 200)
})

export default app

