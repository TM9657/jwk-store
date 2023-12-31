import { validator } from 'hono/validator'
const storedJWK = new Map<string, string>()

export const validation = validator("json", (value, c) => {
    const password = value['password']
    if (!password || typeof password !== 'string') {
      return c.text('Invalid Request!', 400)
    }
    return {
      password: password,
    }
})

export const getStoredJWKString = async (ns: KVNamespace, id: string) => {
    if(storedJWK.has(id)) {
        return storedJWK.get(id)
    }

    const stored = await ns.get(id)
    if(!stored) {
        return null
    }
    storedJWK.set(id, stored)
    return stored;
}

//https://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer
export function base64ToArrayBuffer(base64: string) {
    var binaryString = atob(base64);
    var bytes = new Uint8Array(binaryString.length);
    for (var i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}