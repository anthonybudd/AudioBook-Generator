import tailwindcss from '@tailwindcss/vite';
import svgLoader from 'vite-svg-loader';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  plugins: [vue(), tailwindcss(), svgLoader()],
  worker: { format: 'es' },
  build: { target: 'esnext' },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});