import {readFileSync} from 'node:fs';
import {Readable} from 'node:stream';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {expect,it,vi} from 'vitest';
import {analyzeRoomPhoto} from './room-photo.server';
import {createPhotoHandler} from './photo-handler';
import roomPhotoHandler from '../api/room-photo';
const image='data:image/jpeg;base64,'+readFileSync(new URL('../src/test/fixtures/furnished-room.jpg',import.meta.url)).toString('base64');
const detection={view:'perspective',floor:null,rearEdge:null,notes:'Floor corners are hidden. Approximate contacts only.',furniture:[{label:'Wing chair',footprint:[{x:0.2,y:0.8},{x:0.6,y:0.8},{x:0.6,y:0.9},{x:0.2,y:0.9}],confidence:0.8}]};
it('keeps the new production endpoint disabled until explicitly enabled',async()=>{
  vi.stubEnv('ENABLE_ROOM_ANALYSIS','false');
  try {
    let output='';const res={statusCode:200,setHeader:()=>{},end:(s:string)=>{output=s;}} as unknown as ServerResponse;
    await roomPhotoHandler({} as IncomingMessage,res);
    expect(res.statusCode).toBe(503);
    expect(JSON.parse(output).message).toContain('disabled');
  } finally {vi.unstubAllEnvs();}
});
it('passes a real furnished-room image through validation and server-only configured OpenAI (mocked)',async()=>{
  const provider=vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(detection)}]}]})));
  const handler=createPhotoHandler({env:{OPENAI_API_KEY:'test-only',OPENAI_MODEL:'configured-model'},fetchImpl:provider,analyze:analyzeRoomPhoto});
  const req=Readable.from([JSON.stringify({dataUrl:image})]) as IncomingMessage;
  Object.assign(req,{method:'POST',headers:{host:'localhost','content-type':'application/json'},socket:{remoteAddress:'127.0.0.1'}});
  let output='';const res={statusCode:200,setHeader:()=>{},end:(s:string)=>{output=s;}} as unknown as ServerResponse;
  await handler(req,res);
  expect(res.statusCode).toBe(200);
  expect(JSON.parse(output)).toEqual({ok:true,analysis:detection});
  const body=JSON.parse(String(provider.mock.calls[0][1]?.body));
  expect(body).toMatchObject({store:false,model:'configured-model'});
  expect(body.input[0].content[1].image_url).toBe(image);
  expect(body.text.format.strict).toBe(true);
});
it.each([401,429,500])('handles provider %s without images, credentials or fabricated detections',async status=>{
  const result=await analyzeRoomPhoto(image,{apiKey:'private-test-key',fetchImpl:vi.fn().mockResolvedValue(new Response('',{status}))});
  expect(result.ok).toBe(false);
  expect(JSON.stringify(result)).not.toContain('private-test-key');
  expect(JSON.stringify(result)).not.toContain('base64');
});
it('rejects incomplete or invalid structured responses',async()=>{
  for(const payload of [{status:'incomplete',output:[]},{status:'completed',output:[{type:'message',content:[{type:'output_text',text:'{"furniture":"bad"}'}]}]}]){
    expect((await analyzeRoomPhoto(image,{apiKey:'test',fetchImpl:vi.fn().mockResolvedValue(new Response(JSON.stringify(payload)))})).ok).toBe(false);
  }
});
