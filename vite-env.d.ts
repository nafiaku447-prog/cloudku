/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_USE_SIMULATION?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
