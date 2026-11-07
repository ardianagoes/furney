// Adapted from Angelo's roomfit-furnish-finder @ f541bc9f521201cccc1e0b15aaa58abc3bb5c284.
import { Box3, Matrix4, Mesh, Vector3, type Group } from "three";

/** Bounds in group-local coordinates, independent of room placement/rotation. */
export function furnitureGeometryBounds(group: Group): Box3 {
  group.updateWorldMatrix(true, true);
  const inverse = group.matrixWorld.clone().invert();
  const bounds = new Box3();
  group.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    object.geometry.computeBoundingBox();
    const box = object.geometry.boundingBox;
    if (!box) return;
    const local = new Matrix4().multiplyMatrices(inverse, object.matrixWorld);
    bounds.union(box.clone().applyMatrix4(local));
  });
  return bounds;
}

/** Fit complete visible geometry to confirmed dimensions and ground at y=0. */
export function fitFurnitureGeometry(group: Group, size: { w: number; d: number; h: number }): void {
  group.position.set(0, 0, 0);
  group.scale.set(1, 1, 1);
  const bounds = furnitureGeometryBounds(group);
  const extent = bounds.getSize(new Vector3());
  if (bounds.isEmpty() || extent.x <= 0 || extent.y <= 0 || extent.z <= 0) return;
  group.scale.set(size.w / extent.x, size.h / extent.y, size.d / extent.z);
  const center = bounds.getCenter(new Vector3());
  group.position.set(-center.x * group.scale.x, -bounds.min.y * group.scale.y, -center.z * group.scale.z);
  group.updateWorldMatrix(true, true);
}
