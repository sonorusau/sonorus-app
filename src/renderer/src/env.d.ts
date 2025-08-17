/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly RENDERER_VITE_GITHUB_TOKEN: string;
  readonly RENDERER_VITE_GITHUB_ENTERPRISE_SERVER_TOKEN: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
