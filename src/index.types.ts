export type Bindings = {
  STORAGE: KVNamespace;
  CDN_BUCKET: R2Bucket;
  API_KEY: string;
  BUCKET_PUBLIC_ADDRESS: string;
};

export type JWK = {
  password: string;
  iv: string;
  private_jwk: string;
};