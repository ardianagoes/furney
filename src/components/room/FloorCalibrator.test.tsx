// @vitest-environment jsdom
import {afterEach,it,expect,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {FloorCalibrator} from './FloorCalibrator';
import {DEFAULT_FLOOR_CORNERS} from '../../lib/floorCalibration';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('offers manual calibration with keyboard-adjustable, labeled handles and cancel',()=>{
  const apply=vi.fn(),cancel=vi.fn();
  render(<FloorCalibrator photo="blob:room" corners={null} width={4} depth={6} onApply={apply} onCancel={cancel}/>);
  const handle=screen.getByRole('button',{name:'Rear-left floor corner'});
  fireEvent.keyDown(handle,{key:'ArrowRight'});fireEvent.keyDown(handle,{key:'ArrowDown',shiftKey:true});
  fireEvent.click(screen.getByRole('button',{name:'Apply floor alignment'}));
  expect(apply.mock.calls[0][0][0]).toMatchObject({x:0.152,y:0.22});
  fireEvent.click(screen.getByRole('button',{name:'Cancel alignment'}));expect(cancel).toHaveBeenCalledOnce();
});
it('captures pointer dragging relative to the displayed photo, releases capture, and preserves normalized positions',()=>{
  const apply=vi.fn();
  render(<FloorCalibrator photo="blob:room" corners={null} width={4} depth={6} onApply={apply} onCancel={()=>{}}/>);
  const box=screen.getByAltText('Floor calibration reference').parentElement!;
  vi.spyOn(box,'getBoundingClientRect').mockReturnValue({left:10,top:20,width:600,height:400} as DOMRect);
  const handle=screen.getByRole('button',{name:'Rear-left floor corner'});
  Object.assign(handle,{setPointerCapture:vi.fn(),hasPointerCapture:()=>true,releasePointerCapture:vi.fn()});
  const pointer=(type:string,x:number,y:number)=>{const e=new MouseEvent(type,{bubbles:true,button:0,clientX:x,clientY:y});Object.defineProperty(e,'pointerId',{value:7});fireEvent(handle,e);};
  pointer('pointerdown',100,100);pointer('pointermove',190,180);pointer('pointerup',190,180);
  fireEvent.click(screen.getByRole('button',{name:'Apply floor alignment'}));
  expect(apply.mock.calls[0][0][0]).toEqual({x:0.3,y:0.4});
  expect(handle.releasePointerCapture).toHaveBeenCalledWith(7);
});
it('rejects crossed corners and prevents applying invalid alignment',()=>{
  const bad=[DEFAULT_FLOOR_CORNERS[0],DEFAULT_FLOOR_CORNERS[2],DEFAULT_FLOOR_CORNERS[1],DEFAULT_FLOOR_CORNERS[3]] as typeof DEFAULT_FLOOR_CORNERS;
  render(<FloorCalibrator photo="blob:room" corners={bad} width={4} depth={6} onApply={()=>{}} onCancel={()=>{}}/>);
  expect(screen.getByRole('alert').textContent).toContain('must not cross');
  expect((screen.getByRole('button',{name:'Apply floor alignment'}) as HTMLButtonElement).disabled).toBe(true);
});
