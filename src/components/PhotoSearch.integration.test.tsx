// @vitest-environment jsdom
import { Readable } from 'node:stream';
import { readFileSync } from 'node:fs';
import { URL as NodeURL } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { createPhotoHandler } from '../../server/photo-handler';
import { furnitureProducts } from '../data/furnitureProducts';

vi.mock('./room/RoomScene', () => import('../test/MockRoomScene'));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('uploads real image bytes through validation and mocked OpenAI, then matches, adds, drags, rotates and prices the canonical product', async () => {
  const user = userEvent.setup();
  const provider = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
    status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({
      isFurniture: true, category: 'Sofas', primaryColor: 'black', material: 'leather', style: 'modern', keywords: ['three-seat', 'cushions'],
    }) }] }],
  })));
  const handler = createPhotoHandler({ env: { OPENAI_API_KEY: 'test-only-key', OPENAI_MODEL: 'gpt-5.4-mini' }, fetchImpl: provider });
  // Only the upstream OpenAI transport is mocked; use the actual endpoint,
  // parser, file validation, ranking, callbacks, host adapter and reducer.
  vi.stubGlobal('fetch', vi.fn(async (url: string, options: RequestInit) => {
    expect(url).toBe('/api/photo-search');
    const request = Readable.from([String(options.body)]) as IncomingMessage;
    Object.assign(request, { method: 'POST', headers: { host: 'localhost', 'content-type': 'application/json' }, socket: { remoteAddress: '127.0.0.1' } });
    let result = '';
    const response = { statusCode: 200, setHeader: () => {}, end: (text: string) => { result = text; } } as unknown as ServerResponse;
    await handler(request, response);
    return new Response(result, { status: response.statusCode, headers: { 'Content-Type': 'application/json' } });
  }));
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'Search by Photo' }));
  const file = new File([new Uint8Array(readFileSync(new NodeURL('../assets/ikea/80519531.jpg', import.meta.url)))], 'sofa.jpg', { type: 'image/jpeg' });
  fireEvent.change(screen.getByLabelText('Upload furniture photo'), { target: { files: [file] } });
  await screen.findByText('AI description — please review');
  expect(provider).toHaveBeenCalledOnce();
  expect(JSON.parse(String(provider.mock.calls[0][1]?.body)).model).toBe('gpt-5.4-mini');
  const results = screen.getByRole('list', { name: 'Photo search matches' });
  expect(within(results).getAllByRole('listitem')[0].textContent).toContain('KIVIK');
  const product = furnitureProducts.find(p => p.id === 'ikea-kivik-80519531')!;
  // Add twice to exercise the same auto-placement path from photo matches.
  const add = within(results).getByRole('button', { name: `Add photo match ${product.title} to your room` });
  await user.click(add);
  await user.click(add);
  const planner = screen.getByRole('region', { name: 'Interactive 3D room planner' });
  await screen.findAllByRole('button', { name: `Select scene piece ${product.title}` });
  expect(within(planner).getByText('All pieces fit')).toBeTruthy();
  expect(within(planner).getByText('2.27 × 0.95 × 0.83 m · W × D × H')).toBeTruthy();
  await user.click(screen.getAllByRole('button', { name: `Drag scene piece ${product.title}` })[1]);
  await user.click(within(planner).getByRole('button', { name: 'Rotate selected furniture 90 degrees' }));
  const selected = (within(planner).getByRole('combobox', { name: 'Selected furniture' }) as HTMLSelectElement).value;
  expect(screen.getByTestId(`mesh-${selected}`).textContent).toContain('"x":-0.75,"z":0.5,"rot":90');
  const estimate = screen.getByRole('region', { name: /Your room, piece by piece/ });
  expect(within(estimate).getByText('$2,598')).toBeTruthy();
  await user.click(within(planner).getByRole('button', { name: 'Remove selected furniture' }));
  expect(within(estimate).getAllByText('$1,299')).toHaveLength(2);
});
