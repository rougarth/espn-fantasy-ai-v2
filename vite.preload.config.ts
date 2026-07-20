import { defineConfig } from 'vite';
export default defineConfig({ build: { ssr: 'src/preload/preload.ts', outDir: 'dist-electron', emptyOutDir: false, rollupOptions: { external: ['electron'], output: { format: 'cjs', entryFileNames: 'preload.cjs' } } } });
