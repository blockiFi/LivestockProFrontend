/// <reference types="vite/client" />
interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_FIREBASE_KEY: string;
    // add more vars here
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }