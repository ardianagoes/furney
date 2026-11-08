import type { RoomSceneProps } from '../components/room/RoomScene';

/** DOM tests exercise the real host adapter and reducer. Geometry is tested
 * separately against the actual R3F tree; pointer dragging has browser QA. */
export function RoomScene({ items, onSelect, onMove, selectedId,photo }: RoomSceneProps) {
  return <div data-testid="scene-items"><span data-testid="floor-photo" data-photo={photo??''}/>{items.map(item => <div key={item.id} data-testid={`mesh-${item.id}`}>
    <span>{JSON.stringify({ id: item.id, x: item.x, z: item.z, rot: item.rot, selected: item.id === selectedId })}</span>
    <button onClick={() => onSelect(item.id)}>Select scene piece {item.label}</button>
    <button onClick={() => onMove(item.id, -0.75, 0.5)}>Drag scene piece {item.label}</button>
  </div>)}</div>;
}
