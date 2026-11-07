// Vercel Node serverless entry point. Never bundled into the React application.
import { createPhotoHandler } from '../server/photo-handler.js';

export default createPhotoHandler();
