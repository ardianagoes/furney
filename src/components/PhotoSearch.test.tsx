// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhotoSearch } from './PhotoSearch';
import { furnitureProducts } from '../data/furnitureProducts';
import { MAX_IMAGE_BYTES } from '../lib/photo-search-types';
import App from '../App';

vi.mock('./room/RoomScene', () => import('../test/MockRoomScene'));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const unavailable = () => new Response(JSON.stringify({ ok: false, code: 'not_configured', message: 'AI photo analysis is not configured. Manual search still works.' }), { status: 503, headers: { 'Content-Type': 'application/json' } });

describe('photo search and honest manual fallback', () => {
  it('shows an upload failure without claiming AI success, then finds distinct manual chair and sofa results', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(unavailable());
    vi.stubGlobal('fetch', fetchMock);
    render(<PhotoSearch products={furnitureProducts} onAddProduct={() => {}} />);
    fireEvent.change(screen.getByLabelText('Upload furniture photo'), { target: { files: [new File(['chair photo'], 'chair.jpg', { type: 'image/jpeg' })] } });
    await screen.findByRole('alert');
    expect(screen.getByRole('alert').textContent).toContain('not configured');
    expect(screen.queryByText(/AI description/)).toBeNull();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Manual furniture category' }), 'Chairs');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Manual furniture style' }), 'modern');
    await user.click(screen.getByRole('button', { name: 'Find matches' }));
    expect(screen.getByText('Manual search — no photo was analyzed')).toBeTruthy();
    const results = screen.getByRole('list', { name: 'Photo search matches' });
    expect(within(results).getAllByRole('button', { name: /^Add photo match/ })).toHaveLength(3);
    expect(within(results).queryByText('KIVIK Sofa, Grann/Bomstad black')).toBeNull();
    await user.click(screen.getByText('Manual search (no AI)'));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Manual furniture category' }), 'Sofas');
    await user.click(screen.getByRole('button', { name: 'Find matches' }));
    expect(within(results).getByText('KIVIK Sofa, Grann/Bomstad black')).toBeTruthy();
    expect(within(results).queryByText('POÄNG Armchair, birch veneer/Knisa light beige')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('validates type, empty files, and size before reading or transmitting', async () => {
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    render(<PhotoSearch products={furnitureProducts} onAddProduct={() => {}} />);
    const input = screen.getByLabelText('Upload furniture photo');
    for (const file of [new File(['x'], 'bad.svg', { type: 'image/svg+xml' }), new File([], 'empty.png', { type: 'image/png' }), new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'large.png', { type: 'image/png' })]) {
      fireEvent.change(input, { target: { files: [file] } });
      expect(screen.getByRole('alert')).toBeTruthy();
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('closes with Escape, restores focus, and preserves the ordinary catalog filters', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByRole('searchbox', { name: 'Search furniture' }), 'micke');
    await user.click(screen.getByRole('button', { name: 'Desks' }));
    const trigger = screen.getByRole('button', { name: 'Search by Photo' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Close photo search' }));
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('region', { name: 'Photo search' })).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('micke');
  });

  it('routes a manual match through the actual catalog callback into shared 3D items and pricing', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Search by Photo' }));
    const photoSearch = screen.getByRole('region', { name: 'Photo search' });
    await user.click(within(photoSearch).getByText('Manual search (no AI)'));
    await user.selectOptions(within(photoSearch).getByRole('combobox', { name: 'Manual furniture category' }), 'Desks');
    await user.click(within(photoSearch).getByRole('button', { name: 'Find matches' }));
    const product = furnitureProducts.find(p => p.id === 'ikea-micke-80213074')!;
    await user.click(within(photoSearch).getByRole('button', { name: `Add photo match ${product.title} to your room` }));
    const planner = screen.getByRole('region', { name: 'Interactive 3D room planner' });
    await screen.findByRole('button', { name: `Select scene piece ${product.title}` });
    expect(within(planner).getByText('1 piece selected')).toBeTruthy();
    expect(within(planner).getByText('1.05 × 0.50 × 0.75 m · W × D × H')).toBeTruthy();
    const selected = screen.getByRole('region', { name: /Your room, piece by piece/ });
    expect(within(selected).getAllByText('$109.99')).toHaveLength(2);
    expect(within(photoSearch).getByRole('link', { name: `View photo match ${product.title} at IKEA (opens in a new tab)` }).getAttribute('href')).toBe(product.retailerUrl);
    await user.click(within(planner).getByRole('button', { name: 'Rotate selected furniture 90 degrees' }));
    await user.click(within(planner).getByRole('button', { name: 'Remove selected furniture' }));
    expect(within(selected).getByText('$0')).toBeTruthy();
    await user.click(within(photoSearch).getByRole('button', { name: 'Close photo search' }));
    expect(screen.queryByRole('region', { name: 'Photo search' })).toBeNull();
    expect(screen.getAllByRole('article')).toHaveLength(19);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renders successful structured responses only when returned by the endpoint (mocked transport)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, analysis: { category: 'Chairs', primaryColor: 'black', material: 'mesh', style: 'modern', keywords: ['office'] } }), { headers: { 'Content-Type': 'application/json' } })));
    render(<PhotoSearch products={furnitureProducts} onAddProduct={() => {}} />);
    fireEvent.change(screen.getByLabelText('Upload furniture photo'), { target: { files: [new File(['test image'], 'chair.jpg', { type: 'image/jpeg' })] } });
    await screen.findByText('AI description — please review');
    expect(screen.getByRole('list', { name: 'Photo search matches' }).textContent).toContain('STRANDMON');
  });

  it('ignores an old AI request after the user chooses manual search', async () => {
    let resolve!: (value: Response) => void;
    const fetchMock = vi.fn(() => new Promise<Response>(value => { resolve = value; }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<PhotoSearch products={furnitureProducts} onAddProduct={() => {}} />);
    fireEvent.change(screen.getByLabelText('Upload furniture photo'), { target: { files: [new File(['photo'], 'sofa.jpg', { type: 'image/jpeg' })] } });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    await user.click(screen.getByText('Manual search (no AI)'));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Manual furniture category' }), 'Chairs');
    await user.click(screen.getByRole('button', { name: 'Find matches' }));
    resolve(new Response(JSON.stringify({ ok: true, analysis: { category: 'Sofas', primaryColor: 'grey', material: 'fabric', style: 'modern', keywords: [] } }), { headers: { 'Content-Type': 'application/json' } }));
    await waitFor(() => expect(screen.getByText('Manual search — no photo was analyzed')).toBeTruthy());
    expect(screen.queryByText(/AI description/)).toBeNull();
    expect(screen.getByRole('list', { name: 'Photo search matches' }).textContent).not.toContain('KIVIK');
  });
});
