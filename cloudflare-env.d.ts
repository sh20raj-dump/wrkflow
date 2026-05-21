// Cloudflare Workers environment types
interface CloudflareEnv {
  // Add your Cloudflare environment variables here
  // Example:
  // DATABASE_URL?: string;
  // KV_NAMESPACE?: KVNamespace;
  // R2_BUCKET?: R2Bucket;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends CloudflareEnv {}
  }
}

export {};