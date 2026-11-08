import { createPhotoHandler } from '../server/photo-handler.js';
import { analyzeRoomPhoto } from '../server/room-photo.server.js';
import type { IncomingMessage, ServerResponse } from 'node:http';
export const config = { maxDuration: 30 };
const handler = createPhotoHandler({ analyze: analyzeRoomPhoto });
export default function roomPhoto(request: IncomingMessage, response: ServerResponse) {
  if(process.env.ENABLE_ROOM_ANALYSIS!=='true') {
    response.statusCode=503;response.setHeader('Content-Type','application/json');response.setHeader('Cache-Control','no-store');
    response.end(JSON.stringify({ok:false,code:'not_configured',message:'Experimental room analysis is disabled. Your room photo and manual camera controls still work.'}));return;
  }
  return handler(request,response);
}
