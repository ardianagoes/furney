import {MAX_IMAGE_BYTES} from '../src/lib/photo-search-types.js';
export const MAX_IMAGE_EDGE=4096;
export const MAX_IMAGE_PIXELS=12_000_000;
const fits=(w:number,h:number)=>w>0&&h>0&&w<=MAX_IMAGE_EDGE&&h<=MAX_IMAGE_EDGE&&w*h<=MAX_IMAGE_PIXELS;

/** Header/structure checks, not a full decoder or malware scanner. Never fetch URLs. */
export function validateImage(dataUrl:unknown):dataUrl is string{
  if(typeof dataUrl!=='string'||dataUrl.length>Math.ceil(MAX_IMAGE_BYTES/3)*4+64)return false;
  const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if(!match)return false;
  const b=Buffer.from(match[2],'base64');
  if(!b.length||b.length>MAX_IMAGE_BYTES||b.toString('base64')!==match[2])return false;
  if(match[1]==='image/png'){
    if(b.length<45||!b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))||b.readUInt32BE(8)!==13||b.toString('ascii',12,16)!=='IHDR'||!fits(b.readUInt32BE(16),b.readUInt32BE(20)))return false;
    let offset=8,idat=false;
    while(offset+12<=b.length){
      const length=b.readUInt32BE(offset),type=b.toString('ascii',offset+4,offset+8);
      if(length>b.length-offset-12||type==='acTL')return false;
      if(type==='IDAT')idat=true;
      offset+=length+12;
      if(type==='IEND')return length===0&&idat&&offset===b.length;
    }
    return false;
  }
  if(match[1]==='image/jpeg'){
    if(b.length<4||b.readUInt16BE(0)!==0xffd8||b.readUInt16BE(b.length-2)!==0xffd9)return false;
    let offset=2,dimensions=false;
    while(offset+4<=b.length){
      if(b[offset++]!==0xff)return false;
      while(b[offset]===0xff)offset++;
      const marker=b[offset++];
      if(marker===0xda)return dimensions;
      if(offset+2>b.length)return false;
      const length=b.readUInt16BE(offset);
      if(length<2||offset+length>b.length)return false;
      if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){
        if(length<8||!fits(b.readUInt16BE(offset+5),b.readUInt16BE(offset+3)))return false;
        dimensions=true;
      }
      offset+=length;
    }
    return false;
  }
  if(b.length<20||b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP'||b.readUInt32LE(4)+8!==b.length)return false;
  let offset=12,dimensions=false,frame=false;
  while(offset+8<=b.length){
    const type=b.toString('ascii',offset,offset+4),length=b.readUInt32LE(offset+4),start=offset+8;
    if(length>b.length-start||type==='ANIM'||type==='ANMF')return false;
    if(type==='VP8X'){
      if(length<10||(b[start]&2)!==0||!fits(b.readUIntLE(start+4,3)+1,b.readUIntLE(start+7,3)+1))return false;
      dimensions=true;
    }else if(type==='VP8 '){
      if(length<10||b.toString('hex',start+3,start+6)!=='9d012a'||!fits(b.readUInt16LE(start+6)&0x3fff,b.readUInt16LE(start+8)&0x3fff))return false;
      dimensions=true;frame=true;
    }else if(type==='VP8L'){
      if(length<5||b[start]!==0x2f)return false;
      const bits=b.readUInt32LE(start+1);
      if(!fits((bits&0x3fff)+1,((bits>>>14)&0x3fff)+1))return false;
      dimensions=true;frame=true;
    }
    offset=start+length+(length%2);
  }
  return dimensions&&frame&&offset===b.length;
}
