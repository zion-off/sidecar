import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: 'src',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src')
    }
  },
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: {
        content: './src/content.ts',
        background: './src/background.ts',
        index: './src/index.html'
      },
      output: {
        entryFileNames: (assetInfo) => {
          return assetInfo.name === 'content' || assetInfo.name === 'background' ? '[name].js' : 'assets/[name].js';
        },
        assetFileNames: 'assets/[name][extname]'
      }
    }
  },
  base: './'
});
