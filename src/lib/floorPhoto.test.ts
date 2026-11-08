// @vitest-environment jsdom
import {afterEach,describe,expect,it,vi} from 'vitest';
import {SRGBColorSpace,Texture} from 'three';
import {floorPhotoCrop,fitFloorPhoto,loadFloorPhoto} from './floorPhoto';
import {floorPhotoAreas} from './floorPhotoMapping';
afterEach(()=>vi.unstubAllGlobals());
describe('floor photo cropping and resources',()=>{
  it.each([[1600,900,4,4],[900,1600,6,3],[1000,1000,3,5]])('preserves aspect ratio for %s×%s on a %s×%s floor',(iw,ih,w,d)=>{
    const c=floorPhotoCrop(iw,ih,w,d);
    expect((iw*c.repeatX)/(ih*c.repeatY)).toBeCloseTo(w/d,10);
    expect(Math.max(c.repeatX,c.repeatY)).toBe(1);
    expect(c.offsetX).toBeCloseTo((1-c.repeatX)/2);
    expect(c.offsetY).toBeCloseTo((1-c.repeatY)/2);
    const texture=new Texture({naturalWidth:iw,naturalHeight:ih} as HTMLImageElement);
    fitFloorPhoto(texture,w,d);expect(texture.repeat.x).toBe(c.repeatX);expect(texture.offset.y).toBe(c.offsetY);
    fitFloorPhoto(texture,d,w);expect(texture.repeat.x).toBe(floorPhotoCrop(iw,ih,d,w).repeatX);texture.dispose();
  });
  it('disposes replaced/removed textures once and ignores stale image callbacks',()=>{
    const images:{onload:(()=>void)|null;onerror:(()=>void)|null;src:string;naturalWidth:number;naturalHeight:number}[]=[];
    vi.stubGlobal('Image',class{onload=null;onerror=null;src='';naturalWidth=800;naturalHeight=600;constructor(){images.push(this);}});
    const ready=vi.fn(),error=vi.fn();
    const stop=loadFloorPhoto('blob:first',ready,error);
    const late=images[0].onload!;late();
    const texture=ready.mock.calls[0][0] as Texture;
    expect(texture.colorSpace).toBe(SRGBColorSpace);
    const dispose=vi.spyOn(texture,'dispose');stop();stop();late();
    expect(dispose).toHaveBeenCalledOnce();expect(ready).toHaveBeenCalledOnce();
    expect(images[0].src).toBe('');
    const stopNext=loadFloorPhoto('blob:next',ready,error),nextLate=images[1].onload!;
    stopNext();nextLate();expect(ready).toHaveBeenCalledOnce();expect(error).not.toHaveBeenCalled();
  });
  it('reports decode errors without discarding the source URL or manufacturing a texture',()=>{
    let image:{onerror:(()=>void)|null};
    vi.stubGlobal('Image',class{onerror=null;onload=null;src='';constructor(){image=this;}});
    const ready=vi.fn(),error=vi.fn();const stop=loadFloorPhoto('blob:bad',ready,error);
    image!.onerror!();expect(error).toHaveBeenCalledOnce();expect(ready).not.toHaveBeenCalled();stop();
  });
  it('registers analysis footprints to the same cropped floor instead of the viewer background',()=>{
    const base={view:'perspective' as const,rearEdge:null,floor:null,notes:'Estimate.',furniture:[
      {label:'Center chair',confidence:0.9,footprint:[{x:0.4,y:0.4},{x:0.6,y:0.4},{x:0.6,y:0.6},{x:0.4,y:0.6}]},
      {label:'Cropped-out chair',confidence:0.9,footprint:[{x:0,y:0.4},{x:0.1,y:0.4},{x:0.1,y:0.6}]},
    ]};
    const result=floorPhotoAreas(base,2000,1000,4,4);
    expect(result.areas).toHaveLength(1);expect(result.unresolved).toBe(1);
    expect(result.areas[0]).toMatchObject({label:'Center chair',x:0,z:0});
    expect(result.areas[0].w).toBeCloseTo(1.6);expect(result.areas[0].d).toBeCloseTo(0.8);
  });
});
