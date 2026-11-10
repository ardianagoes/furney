import type {IncomingMessage} from 'node:http';

/** No durable shared quota/concurrency store is configured for this public app.
 * Deployed paid routes stay closed: a key/environment flag alone cannot unlock
 * them. A future public launch needs an atomic, shared usage/budget guard first.
 * Local opt-in is wired ONLY by Vite's configureServer hook. */
export function permitsLocalPaidAI(request:IncomingMessage,env:NodeJS.ProcessEnv,localDevelopment=false){
  if(!localDevelopment||env.ENABLE_LOCAL_AI!=='true')return false;
  if(env.VERCEL||env.VERCEL_ENV||process.env.VERCEL||process.env.VERCEL_ENV||env.NODE_ENV==='production'||process.env.NODE_ENV==='production')return false;
  return ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(request.socket?.remoteAddress??'');
}
export const PAID_AI_DISABLED_MESSAGE='Paid AI analysis is disabled on this public demo until shared usage controls are installed. Manual category/style search and the 3D planner remain available.';
