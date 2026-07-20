import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'src/renderer',
  plugins: [
    react(),
    {
      name: 'development-csp',
      apply: 'serve',
      transformIndexHtml(html) {
        return html.replace("style-src 'self'", "style-src 'self' 'unsafe-inline'");
      }
    }
  ],
  base: './',
  build: { outDir: '../../dist-renderer', emptyOutDir: true }
});
