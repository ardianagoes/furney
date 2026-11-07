import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createPhotoHandler } from './server/photo-handler';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), {
    name: 'furney-photo-search-dev-api',
    configureServer(server) {
      // Server-side env only. No define/import.meta.env injection or VITE_ key.
      const fileEnv = loadEnv(mode, process.cwd(), 'OPENAI_');
      const handler = createPhotoHandler({ env: { ...fileEnv, ...process.env } });
      server.middlewares.use('/api/photo-search', (request, response) => {
        void handler(request, response).catch(() => {
          response.statusCode = 500;
          response.setHeader('Content-Type', 'application/json');
          response.setHeader('Cache-Control', 'no-store');
          response.end(JSON.stringify({ ok: false, code: 'api_error', message: 'Photo analysis is unavailable. Use manual search.' }));
        });
      });
    },
  }],
}));
