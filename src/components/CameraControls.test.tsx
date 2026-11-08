// @vitest-environment jsdom
import {afterEach,it,expect,vi} from 'vitest';
import {cleanup,render,screen,fireEvent} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {CameraControls} from './CameraControls';
import {createCameraStore,defaultRig,topDownRig} from '../lib/cameraControls';
import App from '../App';
import {bindWheelZoom} from '../lib/cameraZoom';
vi.mock('./room/RoomScene',()=>import('../test/MockRoomScene'));
afterEach(cleanup);
const room={widthM:4,depthM:5,heightM:3};
it('streams range input and exact values without re-rendering the planner parent',()=>{
  const store=createCameraStore(defaultRig(room)), parent=vi.fn();
  function Host(){parent();return <CameraControls room={room} store={store} photo={false}/>;}
  render(<Host/>);
  for(const value of ['10','20','35.5'])fireEvent.change(screen.getByLabelText('Turn'),{target:{value}});
  expect(store.getSnapshot().yaw).toBe(35.5);
  expect((screen.getByLabelText('Turn value') as HTMLInputElement).valueAsNumber).toBe(35.5);
  fireEvent.change(screen.getByLabelText('Camera height value'),{target:{value:'4.125'}});
  expect(store.getSnapshot().height).toBe(4.125);expect(parent).toHaveBeenCalledOnce();
  fireEvent.change(screen.getByLabelText('Lens width value'),{target:{value:'1000'}});
  fireEvent.blur(screen.getByLabelText('Lens width value'));expect(store.getSnapshot().fov).toBe(100);
});
it('keeps numeric and range controls synchronized after both presets',async()=>{
  const user=userEvent.setup();render(<App/>);
  await user.click(screen.getByText('Camera controls · adjust your view'));
  await user.click(screen.getByRole('button',{name:'Top-down view'}));
  expect((screen.getByLabelText('Tilt down value') as HTMLInputElement).valueAsNumber).toBe(90);
  expect((screen.getByLabelText('Distance') as HTMLInputElement).valueAsNumber).toBeCloseTo((screen.getByLabelText('Camera height value') as HTMLInputElement).valueAsNumber,2);
  fireEvent.change(screen.getByLabelText('Turn'),{target:{value:'45'}});
  await user.click(screen.getByRole('button',{name:'Reset view'}));
  expect((screen.getByLabelText('Turn value') as HTMLInputElement).valueAsNumber).toBe(30);
  expect((screen.getByLabelText('Tilt down') as HTMLInputElement).valueAsNumber).toBe(34);
});
it('exposes native keyboard focusable controls with bounds and commits numeric keyboard edits',async()=>{
  const user=userEvent.setup(),store=createCameraStore(topDownRig(room,1));
  render(<CameraControls room={room} store={store} photo={false}/>);
  const input=screen.getByLabelText('Distance value');
  await user.clear(input);await user.type(input,'2.75{Enter}');
  expect(store.getSnapshot().height).toBe(2.75);
  expect(store.getSnapshot().distance).toBe(0);
  expect(screen.getByLabelText('Tilt down').getAttribute('max')).toBe('90');
  expect(screen.getByLabelText('Distance').getAttribute('min')).toBe('0.5');
});
it.each([false,true])('synchronizes wheel zoom with both distance inputs, overhead=%s',overhead=>{
  const store=createCameraStore(overhead?topDownRig(room,1):defaultRig(room));
  render(<CameraControls room={room} store={store} photo={false}/>);
  const canvas=document.createElement('canvas');document.body.append(canvas);
  const unbind=bindWheelZoom(canvas,store,room);
  try {
    fireEvent.wheel(canvas,{deltaY:-20,deltaMode:0});
    const expected=overhead?store.getSnapshot().height:store.getSnapshot().distance;
    expect((screen.getByLabelText('Distance value') as HTMLInputElement).valueAsNumber).toBeCloseTo(expected,3);
    expect((screen.getByLabelText('Distance') as HTMLInputElement).valueAsNumber).toBeCloseTo(expected,2);
    if(overhead){expect(store.getSnapshot().pitch).toBe(90);expect(store.getSnapshot().distance).toBe(0);}
  }finally{unbind();canvas.remove();}
});
