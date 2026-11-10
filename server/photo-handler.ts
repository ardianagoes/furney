import type {IncomingMessage,ServerResponse} from 'node:http';
import {MAX_IMAGE_BYTES,type PhotoAnalysisResult} from '../src/lib/photo-search-types.js';
import {analyzeFurniturePhoto} from './photo-analysis.server.js';
import type {RoomAnalysisResult} from '../src/lib/room-photo-types.js';
import {validateImage} from './image-validation.js';
import {permitsLocalPaidAI,PAID_AI_DISABLED_MESSAGE} from './paid-ai-policy.js';
export {validateImage} from './image-validation.js';
const MAX_JSON_BYTES=Math.ceil(MAX_IMAGE_BYTES/3)*4+512;
export const BODY_TIMEOUT_MS=5000;
class BodyTimeout extends Error{}

/** Loopback development burst protection only; NOT a serverless spend guard. */
export function createRateLimiter(now=Date.now){
  let count=0,expires=0;
  return (_address:string)=>{const time=now();if(time>=expires){count=0;expires=time+60_000;}return ++count<=5;};
}

async function readBody(request:IncomingMessage&{body?:unknown}):Promise<unknown>{
  if(Number(request.headers['content-length'])>MAX_JSON_BYTES)throw new RangeError();
  if(request.body!==undefined){
    const raw=Buffer.isBuffer(request.body)?request.body.toString('utf8'):typeof request.body==='string'?request.body:JSON.stringify(request.body);
    if(Buffer.byteLength(raw)>MAX_JSON_BYTES)throw new RangeError();
    return JSON.parse(raw);
  }
  return new Promise((resolve,reject)=>{
    const chunks:Buffer[]=[];let size=0;
    const cleanup=()=>{clearTimeout(timer);request.off('data',data);request.off('end',end);request.off('error',fail);request.off('aborted',abort);};
    const fail=(error:Error)=>{cleanup();request.pause();reject(error);};
    const abort=()=>fail(new Error('Upload aborted'));
    const data=(chunk:Buffer|string)=>{const b=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);size+=b.length;if(size>MAX_JSON_BYTES)fail(new RangeError());else chunks.push(b);};
    const end=()=>{cleanup();try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{reject(new Error('Invalid JSON'));}};
    const timer=setTimeout(()=>fail(new BodyTimeout()),BODY_TIMEOUT_MS);
    request.on('data',data);request.once('end',end);request.once('error',fail);request.once('aborted',abort);
  });
}

type ProviderOptions={apiKey:string;model?:string;fetchImpl?:typeof fetch;signal?:AbortSignal};
export function createPhotoHandler(options:{env?:NodeJS.ProcessEnv;localDevelopment?:boolean;fetchImpl?:typeof fetch;allowRequest?:(address:string)=>boolean;analyze?:(dataUrl:string,options:ProviderOptions)=>Promise<PhotoAnalysisResult|RoomAnalysisResult>}={}){
  const allowRequest=options.allowRequest??createRateLimiter();let inFlight=0;
  return async(request:IncomingMessage&{body?:unknown},response:ServerResponse)=>{
    const send=(status:number,result:PhotoAnalysisResult|RoomAnalysisResult)=>{
      if(response.destroyed||response.writableEnded)return;
      response.statusCode=status;response.setHeader('Content-Type','application/json; charset=utf-8');response.setHeader('Cache-Control','no-store');response.setHeader('X-Content-Type-Options','nosniff');response.end(JSON.stringify(result));
    };
    if(request.method!=='POST'){response.setHeader('Allow','POST');return send(405,{ok:false,code:'unsupported',message:'Use POST to upload a furniture image.'});}
    const env=options.env??process.env;
    // Before body reading/decoding/upstream work. Deployed entry points NEVER
    // pass localDevelopment; keys and old experimental flags cannot bypass this.
    if(!permitsLocalPaidAI(request,env,options.localDevelopment))return send(503,{ok:false,code:'not_configured',message:PAID_AI_DISABLED_MESSAGE});
    try{
      if(request.headers.origin&&new URL(request.headers.origin).host!==request.headers.host)return send(403,{ok:false,code:'unsupported',message:'Use photo search from this application.'});
    }catch{return send(403,{ok:false,code:'unsupported',message:'Invalid request origin.'});}
    if(inFlight>=1){response.setHeader('Retry-After','30');return send(429,{ok:false,code:'rate_limited',message:'A local analysis is already running. Use manual search or wait.'});}
    if(!allowRequest(request.socket.remoteAddress??'unknown')){response.setHeader('Retry-After','60');return send(429,{ok:false,code:'rate_limited',message:'Too many local photo searches. Wait a minute or use manual search.'});}
    if(request.headers['content-type']?.split(';')[0].trim().toLowerCase()!=='application/json'||request.headers['content-encoding'])return send(415,{ok:false,code:'unsupported',message:'Upload a JPG, PNG, or WebP photo using uncompressed JSON.'});
    let body:unknown;
    try{body=await readBody(request);}catch(error){
      response.setHeader('Connection','close');
      return send(error instanceof RangeError?413:error instanceof BodyTimeout?408:400,{ok:false,code:'unsupported',message:'Invalid, oversized, or timed-out image upload. Choose a JPG, PNG, or WebP up to 3 MB.'});
    }
    const dataUrl=body&&typeof body==='object'&&Object.keys(body).length===1&&'dataUrl' in body?body.dataUrl:undefined;
    if(!validateImage(dataUrl))return send(400,{ok:false,code:'unsupported',message:'Choose a valid, nonanimated JPG, PNG, or WebP up to 3 MB, 4096 pixels per edge and 12 megapixels.'});
    if(!env.OPENAI_API_KEY?.trim())return send(503,{ok:false,code:'not_configured',message:'AI photo analysis is not configured. Manual category/style search still works.'});
    // Recheck after asynchronous body reading to close the simultaneous-upload race.
    if(inFlight>=1){response.setHeader('Retry-After','30');return send(429,{ok:false,code:'rate_limited',message:'A local analysis is already running. Use manual search or wait.'});}
    inFlight++;
    const controller=new AbortController(),abort=()=>controller.abort();
    request.once('aborted',abort);response.once?.('close',abort);
    try{
      if(request.aborted)throw new Error('Aborted');
      const result=await(options.analyze??analyzeFurniturePhoto)(dataUrl,{apiKey:env.OPENAI_API_KEY.trim(),model:env.OPENAI_MODEL,fetchImpl:options.fetchImpl,signal:controller.signal});
      send(result.ok?200:result.code==='not_configured'?503:result.code==='rate_limited'?429:result.code==='not_furniture'?422:502,result);
    }catch{return send(502,{ok:false,code:'api_error',message:'Analysis could not complete. Use manual search.'});}
    finally{request.off('aborted',abort);response.off?.('close',abort);inFlight--;}
  };
}
