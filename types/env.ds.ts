// types/env.d.ts

declare namespace NodeJS {
  interface ProcessEnv {
    readonly GOOGLE_GENAI_API_KEY: string;
    // Add other environment variables here if needed
    // readonly NODE_ENV: 'development' | 'production' | 'test';
  }
}
