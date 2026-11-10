/** Bound provider JSON as well as model tokens. No upstream body is logged. */
export async function readProviderJson(response:Response):Promise<unknown>{
  const limit=128*1024;
  if(Number(response.headers.get('content-length'))>limit){await response.body?.cancel();throw new Error('Response too large');}
  const reader=response.body?.getReader();if(!reader)throw new Error('Empty response');
  const chunks:Uint8Array[]=[];let size=0;
  try{
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit)throw new Error('Response too large');chunks.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    return JSON.parse(new TextDecoder().decode(bytes));
  }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
