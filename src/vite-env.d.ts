/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENV: 'dev' | 'prod'
  readonly VITE_BASE_PATH: string
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
