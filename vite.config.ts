import react from '@vitejs/plugin-react';
import hotReloadExtension from 'hot-reload-extension-vite';
import { fileURLToPath } from 'node:url';
import path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      react(),
      hotReloadExtension({
        log: true,
        backgroundPath: 'src/background.ts'
      })
    ].filter(Boolean),

    root: 'src',
    publicDir: 'public',
    base: './',

    resolve: {
      alias: {
        '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src')
      }
    },

    build: {
      outDir: '../dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          content: './src/content.ts',
          background: './src/background.ts',
          index: './src/index.html'
        },
        output: {
          entryFileNames: (assetInfo) => {
            // Keep background and content scripts at root level
            return ['content', 'background'].includes(assetInfo.name as string) ? '[name].js' : 'assets/[name].js';
          },
          assetFileNames: 'assets/[name][extname]'
        }
      }
    }
  };
});
