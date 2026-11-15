import { resolve } from 'path';
import { readFileSync } from 'fs';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as {
  version: string;
};

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    build: {
      rollupOptions: {
        input: {
          chat: resolve(__dirname, 'src/preload/chat.ts'),
          overlay: resolve(__dirname, 'src/preload/overlay.ts'),
          onboarding: resolve(__dirname, 'src/preload/onboarding.ts'),
        },
      },
    },
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    build: {
      rollupOptions: {
        input: {
          overlay: resolve(__dirname, 'src/renderer/overlay/index.html'),
          onboarding: resolve(__dirname, 'src/renderer/onboarding/index.html'),
          offline: resolve(__dirname, 'src/renderer/offline/index.html'),
        },
      },
    },
  },
});
