export type Bindings = {
    STORAGE: KVNamespace
    API_KEY: string
  }
  
export type JWK = {
    password: string,
    iv: ArrayBuffer,
    private_jwk: ArrayBuffer,
    public_jwk: any,
}