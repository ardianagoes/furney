import { parseRoomAnalysis, type RoomAnalysisResult } from './room-photo-types';
import { MAX_IMAGE_BYTES } from './photo-search-types';
export async function prepareRoomPhoto(photo: string): Promise<string> {
  const image=new Image();
  await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(new Error('The room photo could not be opened.'));image.src=photo;});
  const scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image preparation is unavailable. Keep using manual alignment.');
  ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const dataUrl=canvas.toDataURL('image/jpeg',0.85);
  if((dataUrl.split(',')[1]?.length??0)*3/4>MAX_IMAGE_BYTES)throw new Error('This photo is too large for analysis. Choose a smaller image.');
  return dataUrl;
}
export async function analyzeRoom(photo: string, signal: AbortSignal): Promise<RoomAnalysisResult> {
  if(!import.meta.env.DEV)return {ok:false,code:'not_configured',message:'Paid room analysis is disabled on the public demo. Your photo and manual floor alignment still work.'};
  const dataUrl=await prepareRoomPhoto(photo);
  if(signal.aborted)throw new Error('Cancelled');
  const response=await fetch('/api/room-photo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dataUrl}),signal});
  if(response.status===404||response.status===503)return {ok:false,code:'not_configured',message:'Room analysis is not configured on this server. Your photo and manual camera controls still work.'};
  if(response.status===429)return {ok:false,code:'rate_limited',message:'Room analysis limit reached. Wait a minute or align manually.'};
  const data=await response.json() as RoomAnalysisResult;
  if(response.ok&&data.ok){const analysis=parseRoomAnalysis(data.analysis);if(analysis)return {ok:true,analysis};}
  return {ok:false,code:'api_error',message:!data.ok&&typeof data.message==='string'?data.message.slice(0,300):'Room analysis returned an unreadable result. Align manually.'};
}
