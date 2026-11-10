import {afterEach,expect,it,vi} from 'vitest';
import {PassThrough,Readable} from 'node:stream';
import {EventEmitter} from 'node:events';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {readFileSync} from 'node:fs';
import photoRoute from '../api/photo-search';
import roomRoute from '../api/room-photo';
import {createPhotoHandler,BODY_TIMEOUT_MS,validateImage} from './photo-handler';
import {permitsLocalPaidAI} from './paid-ai-policy';
import {analyzeFurniturePhoto} from './photo-analysis.server';
import {analyzeRoomPhoto} from './room-photo.server';

const image='data:image/jpeg;base64,'+readFileSync(new URL('../src/assets/ikea/00457235.jpg',import.meta.url)).toString('base64');
const local={localDevelopment:true,env:{ENABLE_LOCAL_AI:'true',OPENAI_API_KEY:'test-only-key'},allowRequest:()=>true};
function req(raw=JSON.stringify({dataUrl:image}),address='127.0.0.1'){
  return Object.assign(Readable.from([raw]),{method:'POST',headers:{host:'localhost','content-type':'application/json'},socket:{remoteAddress:address}}) as unknown as IncomingMessage;
}
function res(){
  let raw='';const headers:Record<string,string>={};
  const response=Object.assign(new EventEmitter(),{statusCode:200,setHeader:(key:string,value:string)=>{headers[key]=value;},end:(text:string)=>{raw=text;}}) as unknown as ServerResponse;
  return {response,headers,result:()=>JSON.parse(raw),raw:()=>raw};
}
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();vi.unstubAllEnvs();vi.useRealTimers();});

it.each([photoRoute,roomRoute])('blocks real deployed entry points even with keys, local opt-in and experiment flags, before body reads',async route=>{
  vi.stubEnv('OPENAI_API_KEY','test-only-key');vi.stubEnv('OPENAI_MODEL','configured-model');
  vi.stubEnv('ENABLE_LOCAL_AI','true');vi.stubEnv('ENABLE_ROOM_ANALYSIS','true');vi.stubEnv('VITE_ENABLE_ROOM_ANALYSIS','true');
  const fetchImpl=vi.fn();vi.stubGlobal('fetch',fetchImpl);
  const request=req();let bodyReads=0;
  Object.defineProperty(request,'body',{get:()=>{bodyReads++;throw new Error('Do not read this body');}});
  const output=res();await route(request,output.response);
  expect(output.response.statusCode).toBe(503);expect(output.result()).toMatchObject({ok:false,code:'not_configured'});
  expect(bodyReads).toBe(0);expect(request.readableFlowing).not.toBe(true);expect(fetchImpl).not.toHaveBeenCalled();
  expect(output.headers['Cache-Control']).toBe('no-store');expect(output.raw()).not.toContain('test-only-key');
});

it('has no cold-start/IP-rotation escape from the public paid-call prohibition',async()=>{
  const fetchImpl=vi.fn();
  for(let i=0;i<50;i++){
    const handler=createPhotoHandler({env:{ENABLE_LOCAL_AI:'true',OPENAI_API_KEY:'test-only-key'},allowRequest:()=>true,fetchImpl});
    const request=req('',`203.0.113.${i}`);request.headers['x-forwarded-for']='127.0.0.1';request.headers['x-vercel-forwarded-for']='127.0.0.1';request.headers.origin='http://localhost';
    const output=res();await handler(request,output.response);expect(output.response.statusCode).toBe(503);
  }
  expect(fetchImpl).not.toHaveBeenCalled();
});

it('allows local paid analysis only through explicit Vite opt-in, actual loopback and a nondeployed process',()=>{
  const request=req();expect(permitsLocalPaidAI(request,local.env,true)).toBe(true);
  expect(permitsLocalPaidAI(request,local.env)).toBe(false);
  expect(permitsLocalPaidAI(request,{ENABLE_LOCAL_AI:'false'},true)).toBe(false);
  expect(permitsLocalPaidAI(req('','198.51.100.1'),local.env,true)).toBe(false);
  for(const env of [{VERCEL:'1'},{VERCEL_ENV:'preview'},{NODE_ENV:'production'}])expect(permitsLocalPaidAI(request,{...local.env,...env},true)).toBe(false);
  vi.stubEnv('VERCEL','1');expect(permitsLocalPaidAI(request,local.env,true)).toBe(false);
});

it('bounds chunked/preparsed JSON, rejects compression and unexpected parameters without a provider call',async()=>{
  const analyze=vi.fn();const handler=createPhotoHandler({...local,analyze});
  for(const [request,status] of [
    [req(' '.repeat(4.2*1024*1024)),413],
    [Object.assign(req(),{body:{dataUrl:image,model:'expensive-user-model'}}),400],
    [Object.assign(req(),{body:{dataUrl:'data:image/png;base64,'+'A'.repeat(4.2*1024*1024)}}),413],
    [Object.assign(req(),{headers:{host:'localhost','content-type':'application/json','content-encoding':'gzip'}}),415],
  ] as const){const output=res();await handler(request,output.response);expect(output.response.statusCode).toBe(status);}
  expect(analyze).not.toHaveBeenCalled();
});

it('terminates slow uploads within five seconds without paying for analysis',async()=>{
  vi.useFakeTimers();const analyze=vi.fn();
  const request=Object.assign(new PassThrough(),{method:'POST',headers:{host:'localhost','content-type':'application/json'},socket:{remoteAddress:'127.0.0.1'}}) as unknown as IncomingMessage;
  const output=res(),done=createPhotoHandler({...local,analyze})(request,output.response);
  await vi.advanceTimersByTimeAsync(BODY_TIMEOUT_MS+1);await done;
  expect(output.response.statusCode).toBe(408);expect(output.headers.Connection).toBe('close');expect(analyze).not.toHaveBeenCalled();request.destroy();
});

it('permits only one local in-flight request, including simultaneous body reads, and releases on failure',async()=>{
  let finish!:(value:{ok:false;code:'api_error';message:string})=>void;
  const analyze=vi.fn(()=>new Promise<{ok:false;code:'api_error';message:string}>(resolve=>{finish=resolve;}));
  const handler=createPhotoHandler({...local,analyze}),a=res(),b=res();
  const pending=handler(req(),a.response);await vi.waitFor(()=>expect(analyze).toHaveBeenCalledOnce());
  await handler(req(),b.response);expect(b.response.statusCode).toBe(429);expect(analyze).toHaveBeenCalledOnce();
  finish({ok:false,code:'api_error',message:'Safe failure'});await pending;
  analyze.mockImplementationOnce(async()=>({ok:false,code:'api_error',message:'Safe failure'}));
  const c=res();await handler(req(),c.response);expect(analyze).toHaveBeenCalledTimes(2);expect(c.response.statusCode).toBe(502);
});

it('aborts the upstream operation when the local client disconnects and sanitizes thrown errors',async()=>{
  let signal:AbortSignal|undefined;
  const analyze=vi.fn((_image:string,options:{signal?:AbortSignal})=>new Promise<never>((_resolve,reject)=>{signal=options.signal;signal?.addEventListener('abort',()=>reject(new Error('private-test-key '+image)),{once:true});}));
  const output=res(),pending=createPhotoHandler({...local,analyze})(req(),output.response);
  await vi.waitFor(()=>expect(signal).toBeDefined());output.response.emit('close');await pending;
  expect(signal?.aborted).toBe(true);expect(output.raw()).not.toContain('private-test-key');expect(output.raw()).not.toContain('base64');
});

it('rejects header-only, truncated, animated, and excessive-dimension images',()=>{
  expect(validateImage('data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA')).toBe(true);
  expect(validateImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jSusAAAAASUVORK5CYII=')).toBe(true);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jSusAAAAASUVORK5CYII=','base64');
  png.writeUInt32BE(50000,16);expect(validateImage('data:image/png;base64,'+png.toString('base64'))).toBe(false);
  const jpeg=Buffer.from(image.split(',')[1],'base64');let sof=jpeg.indexOf(Buffer.from('ffc0','hex'));if(sof<0)sof=jpeg.indexOf(Buffer.from('ffc2','hex'));
  expect(sof).toBeGreaterThan(0);jpeg.writeUInt16BE(50000,sof+7);expect(validateImage('data:image/jpeg;base64,'+jpeg.toString('base64'))).toBe(false);
  for(const [mime,buffer] of [['png',Buffer.from('89504e470d0a1a0a','hex')],['jpeg',Buffer.from('ffd8ff','hex')],['webp',Buffer.from('RIFF0000WEBP')]] as const)expect(validateImage(`data:image/${mime};base64,${buffer.toString('base64')}`)).toBe(false);
  const webp=Buffer.alloc(30);webp.write('RIFF');webp.writeUInt32LE(22,4);webp.write('WEBPVP8X',8);webp.writeUInt32LE(10,16);webp[20]=2;
  expect(validateImage('data:image/webp;base64,'+webp.toString('base64'))).toBe(false);
  expect(validateImage(image.slice(0,-8))).toBe(false);
});

it.each([analyzeFurniturePhoto,analyzeRoomPhoto])('caps provider response bytes and never follows upstream redirects',async analyze=>{
  const fetchImpl=vi.fn<typeof fetch>().mockResolvedValue(new Response(' '.repeat(129*1024)));
  const result=await analyze(image,{apiKey:'test-only-key',fetchImpl});
  expect(result.ok).toBe(false);expect(fetchImpl).toHaveBeenCalledOnce();
  const [url,init]=fetchImpl.mock.calls[0];expect(url).toBe('https://api.openai.com/v1/responses');expect(init?.redirect).toBe('error');
  const body=JSON.parse(String(init?.body));expect(body.store).toBe(false);expect(body.max_output_tokens).toBeLessThanOrEqual(4000);
  expect(init?.signal).toBeInstanceOf(AbortSignal);
});
