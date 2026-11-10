import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createPhotoHandler } from './server/photo-handler';
import { analyzeRoomPhoto } from './server/room-photo.server';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), {
    name: 'furney-photo-search-dev-api',
    configureServer(server) {
      // Server-side env only. No define/import.meta.env injection or VITE_ key.
      const fileEnv = {...loadEnv(mode, process.cwd(), 'OPENAI_'),...loadEnv(mode,process.cwd(),'ENABLE_')};
      const handler = createPhotoHandler({ env: { ...fileEnv, ...process.env },localDevelopment:true });
      const roomHandler = createPhotoHandler({ env: { ...fileEnv, ...process.env },localDevelopment:true, analyze: analyzeRoomPhoto });
      server.middlewares.use('/api/room-photo', (request, response) => {
        if(process.env.ENABLE_ROOM_ANALYSIS!=='true'&&loadEnv(mode,process.cwd(),'ENABLE_').ENABLE_ROOM_ANALYSIS!=='true'){
          response.statusCode=503;response.setHeader('Content-Type','application/json');response.setHeader('Cache-Control','no-store');
          response.end(JSON.stringify({ok:false,code:'not_configured',message:'Experimental room analysis is disabled. Manual alignment still works.'}));return;
        }
        void roomHandler(request, response).catch(() => {
        response.statusCode = 500; response.setHeader('Content-Type','application/json');
        response.end(JSON.stringify({ok:false,code:'api_error',message:'Room analysis is unavailable. Align manually.'}));
      }); });
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
