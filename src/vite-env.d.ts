/// <reference types="vite/client" />

interface Window {
  mutationDebounceTimeout: ReturnType<typeof setTimeout> | null;
}
