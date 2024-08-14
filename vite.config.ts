import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
// @ts-ignore
import nodePolyfillsBrowser from 'vite-plugin-node-stdlib-browser';

export default defineConfig({
  plugins: [
    vue(),
    nodePolyfills({
      include: ['buffer', 'stream', 'string_decoder', 'events', 'assert', 'util'],
      globals: {
        Buffer: false,
        global: true,
        process: false,
      },
    }),    nodePolyfillsBrowser() // Add this line

  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})