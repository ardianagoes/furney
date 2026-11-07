// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { furnitureProducts } from '../data/furnitureProducts';

vi.mock('./room/RoomScene', () => import('../test/MockRoomScene'));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('3D planner wired to Furney shared state', () => {
  it('renders catalog additions, selects, drags, rotates, and removes the same shared instances', async () => {
    const user = userEvent.setup();
    render(<App />);
    const planner = screen.getByRole('region', { name: 'Interactive 3D room planner' });
    const selection = screen.getByRole('region', { name: /Your room, piece by piece/ });
    const sofa = furnitureProducts[0];
    await user.click(screen.getByRole('button', { name: `Add ${sofa.title} to your room` }));
    await screen.findByRole('button', { name: `Drag scene piece ${sofa.title}` });
    expect(within(planner).getByText('All pieces fit')).toBeTruthy();
    const dropdown = within(planner).getByRole('combobox', { name: 'Selected furniture' }) as HTMLSelectElement;
    const instanceId = dropdown.value;
    expect(instanceId).not.toBe('');
    const mesh = screen.getByTestId(`mesh-${instanceId}`);
    expect(mesh.textContent).toContain('"x":0,"z":0,"rot":0');
    await user.click(screen.getByRole('button', { name: `Drag scene piece ${sofa.title}` }));
    expect(mesh.textContent).toContain('"x":-0.75,"z":0.5');
    expect((within(planner).getByRole('spinbutton', { name: 'Selected piece X in meters' }) as HTMLInputElement).valueAsNumber).toBeCloseTo(1.0788);
    await user.click(within(planner).getByRole('button', { name: 'Rotate selected furniture 90 degrees' }));
    expect(mesh.textContent).toContain('"rot":90');
    expect(within(selection).getAllByText('$1,299')).toHaveLength(2);
    await user.click(within(planner).getByRole('button', { name: 'Remove selected furniture' }));
    expect(screen.queryByTestId(`mesh-${instanceId}`)).toBeNull();
    expect(within(selection).getByText('$0')).toBeTruthy();
    expect(within(selection).queryAllByRole('listitem')).toHaveLength(0);
  });

  it('recomputes overlap, wall/ceiling warnings, and geometry after edits and room resizing', async () => {
    const user = userEvent.setup();
    render(<App />);
    const planner = screen.getByRole('region', { name: 'Interactive 3D room planner' });
    const sofa = furnitureProducts[0];
    const add = screen.getByRole('button', { name: `Add ${sofa.title} to your room` });
    await user.click(add);
    await user.click(add);
    await waitFor(() => expect(within(planner).getByText('All pieces fit')).toBeTruthy());
    // Auto-placement starts without overlap; manually move the second piece
    // onto the first to check that dragging/precise edits still warn.
    fireEvent.change(within(planner).getByRole('spinbutton', { name: 'Selected piece X in meters' }), { target: { value: '1.8288' } });
    fireEvent.change(within(planner).getByRole('spinbutton', { name: 'Selected piece Z in meters' }), { target: { value: '2.1336' } });
    await waitFor(() => expect(within(planner).getByText('2 pieces need attention')).toBeTruthy());
    expect(within(planner).getAllByText(/Overlaps Linden/).length).toBeGreaterThan(0);
    const x = within(planner).getByRole('spinbutton', { name: 'Selected piece X in meters' });
    fireEvent.change(x, { target: { value: '0' } });
    expect(within(planner).getAllByText(/Outside room bounds/).length).toBeGreaterThan(0);
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Room width in feet' }), { target: { value: '1' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Room height in feet' }), { target: { value: '1' } });
    await user.click(screen.getByRole('button', { name: 'Apply dimensions' }));
    expect(screen.getByText('Room dimensions updated.')).toBeTruthy();
    expect(within(planner).getByText('2 pieces need attention')).toBeTruthy();
    await user.click(within(planner).getByRole('button', { name: 'Remove selected furniture' }));
    expect(within(planner).getByText('1 piece needs attention')).toBeTruthy();
  });

  it('selects a different existing mesh without duplicating placement state', async () => {
    const user = userEvent.setup();
    render(<App />);
    for (const product of [furnitureProducts[0], furnitureProducts[9]]) await user.click(screen.getByRole('button', { name: `Add ${product.title} to your room` }));
    await user.click(await screen.findByRole('button', { name: `Select scene piece ${furnitureProducts[0].title}` }));
    const planner = screen.getByRole('region', { name: 'Interactive 3D room planner' });
    const dropdown = within(planner).getByRole('combobox') as HTMLSelectElement;
    expect(dropdown.selectedOptions[0].textContent).toContain(furnitureProducts[0].title);
    await user.click(within(planner).getByRole('button', { name: 'Remove selected furniture' }));
    expect(screen.getByRole('button', { name: `Select scene piece ${furnitureProducts[9].title}` })).toBeTruthy();
    expect(screen.queryByRole('button', { name: `Select scene piece ${furnitureProducts[0].title}` })).toBeNull();
  });

  it('keeps a room photo local, validates uploads, and releases object URLs', async () => {
    const createUrl = vi.fn(() => 'blob:test-photo');
    const revokeUrl = vi.fn();
    vi.stubGlobal('URL', class extends URL {
      static createObjectURL = createUrl;
      static revokeObjectURL = revokeUrl;
    });
    try {
      render(<App />);
      const input = screen.getByLabelText('Upload room photo');
      fireEvent.change(input, { target: { files: [new File(['picture'], 'room.png', { type: 'image/png' })] } });
      expect(screen.getByRole('img', { name: 'Uploaded room reference' }).getAttribute('src')).toBe('blob:test-photo');
      expect(screen.getByText(/Align the camera manually/)).toBeTruthy();
      fireEvent.click(screen.getByRole('button', { name: 'Remove photo' }));
      expect(revokeUrl).toHaveBeenCalledWith('blob:test-photo');
      fireEvent.change(input, { target: { files: [new File(['bad'], 'not-a-photo.txt', { type: 'text/plain' })] } });
      expect(screen.getByRole('alert').textContent).toContain('JPG, PNG, or WebP');
      expect(createUrl).toHaveBeenCalledTimes(1);
    } finally { vi.unstubAllGlobals(); }
  });
});
