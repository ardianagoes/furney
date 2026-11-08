import type {PerspectiveCamera} from 'three';
import type {CameraRig} from './cameraControls';
/** Called only when pose/viewport changes. Geometry and lighting stay untouched. */
export function applyCameraPose(cam:PerspectiveCamera,rig:CameraRig,width:number,height:number,alignment:{x:number;y:number}){
  const radians=Math.PI/180;
  const projectionChanged=cam.fov!==rig.fov||cam.aspect!==width/height;
  cam.fov=rig.fov;cam.aspect=width/height;
  cam.position.set(Math.sin(rig.yaw*radians)*rig.distance,rig.height,Math.cos(rig.yaw*radians)*rig.distance);
  cam.rotation.order='YXZ';cam.rotation.set(-rig.pitch*radians,rig.yaw*radians,0);
  if(alignment.x!==0||alignment.y!==0) {
    const v=cam.view;
    if(projectionChanged||!v?.enabled||v.fullWidth!==width||v.fullHeight!==height||v.offsetX!==-alignment.x*width||v.offsetY!==-alignment.y*height)
      cam.setViewOffset(width,height,-alignment.x*width,-alignment.y*height,width,height);
  } else if(cam.view?.enabled) cam.clearViewOffset();
  else if(projectionChanged) cam.updateProjectionMatrix();
  cam.updateMatrixWorld();
}
