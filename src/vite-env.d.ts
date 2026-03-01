/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (action: string, eventName: string, params?: Record<string, unknown>, options?: { eventID?: string }) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

