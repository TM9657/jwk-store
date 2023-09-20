export type Bindings = {
    STORAGE: KVNamespace
    API_KEY: string
  }
  
export type JWK = {
    password: string,
    iv: string,
    private_jwk: string,
    public_jwk: any,
}