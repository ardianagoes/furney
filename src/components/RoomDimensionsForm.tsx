import { useState, type FormEvent } from 'react';
import { Check, Ruler } from 'lucide-react';
import type { RoomDimensions } from '../types';
import { feetInchesToMeters, metersToFeetInches, MAX_ROOM_METERS } from '../lib/units';

const axes = [{ key: 'widthM', label: 'Width' }, { key: 'depthM', label: 'Depth' }, { key: 'heightM', label: 'Height' }] as const;

export function RoomDimensionsForm({ room, onChange }: { room: RoomDimensions; onChange: (room: RoomDimensions) => void }) {
  const [draft, setDraft] = useState(() => Object.fromEntries(axes.map(({ key }) => {
    const value = metersToFeetInches(room[key]);
    return [key, { feet: String(value.feet), inches: String(value.inches) }];
  })) as Record<keyof RoomDimensions, { feet: string; inches: string }>);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = { ...room };
    for (const { key, label } of axes) {
      const feet = Number(draft[key].feet);
      const inches = Number(draft[key].inches);
      const meters = feetInchesToMeters(feet, inches);
      if (draft[key].feet === '' || draft[key].inches === '' || !Number.isInteger(feet) || !Number.isInteger(inches) || feet < 0 || inches < 0 || inches > 11 || meters < 0.3048 || meters > MAX_ROOM_METERS) {
        setError(`${label}: enter 1–100 feet total, with whole inches from 0 to 11.`);
        setMessage('');
        return;
      }
      next[key] = meters;
    }
    onChange(next);
    setError('');
    setMessage('Room dimensions updated.');
  }

  return <form onSubmit={submit} className="dimensions-form" aria-label="Room dimensions" noValidate>
    <div className="dimensions-heading"><Ruler size={17} /><div><h3>Your room dimensions</h3><span>Start with the space you have.</span></div></div>
    <div className="dimension-inputs">
      {axes.map(({ key, label }) => <fieldset key={key}>
        <legend>{label}</legend>
        <div className="dimension-pair">
          {(['feet', 'inches'] as const).map(unit => <label key={unit}>
            <span className="sr-only">Room {label.toLowerCase()} in {unit}</span>
            <input type="number" inputMode="numeric" min="0" max={unit === 'feet' ? 100 : 11} step="1" value={draft[key][unit]} aria-describedby={error ? 'dimension-error' : undefined} onChange={event => {
              setDraft(previous => ({ ...previous, [key]: { ...previous[key], [unit]: event.target.value } }));
              setMessage(''); setError('');
            }} />
            <span aria-hidden="true">{unit === 'feet' ? 'ft' : 'in'}</span>
          </label>)}
        </div>
      </fieldset>)}
    </div>
    <button className="button button-outline dimension-apply" type="submit">Apply dimensions <Check size={15} /></button>
    {error && <p id="dimension-error" role="alert" className="form-message form-error">{error}</p>}
    {message && <p role="status" className="form-message">{message}</p>}
  </form>;
}
