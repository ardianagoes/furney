// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { FurnitureCatalog } from './FurnitureCatalog';
import { furnitureProducts } from '../data/furnitureProducts';

afterEach(cleanup);

describe('catalog UI in Furney', () => {
  it('labels samples, imported prices, and external retailer links accurately', () => {
    render(<FurnitureCatalog products={furnitureProducts} placedItems={[]} onAddProduct={() => {}} />);
    expect(screen.getAllByRole('article')).toHaveLength(21);
    expect(screen.getAllByText('Sample product')).toHaveLength(15);
    expect(screen.getAllByText('IKEA link')).toHaveLength(6);
    expect(screen.queryByText(/verified retailer/i)).toBeNull();
    expect(screen.getByText(/not live or independently verified/)).toBeTruthy();
    const link = screen.getByRole('link', { name: /View KIVIK Sofa/ });
    expect(link.getAttribute('href')).toBe(furnitureProducts[15].retailerUrl);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('combines search, category filters, sorting, and clearing an empty result', async () => {
    const user = userEvent.setup();
    render(<FurnitureCatalog products={furnitureProducts} placedItems={[]} onAddProduct={() => {}} />);
    await user.type(screen.getByRole('searchbox', { name: 'Search furniture' }), 'micke');
    await user.click(screen.getByRole('button', { name: 'Desks' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort by price' }), 'asc');
    expect(screen.getAllByRole('article').map(card => within(card).getByRole('heading').textContent)).toEqual([
      furnitureProducts[18].title, furnitureProducts[17].title,
    ]);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort by price' }), 'desc');
    expect(within(screen.getAllByRole('article')[0]).getByRole('heading').textContent).toBe(furnitureProducts[17].title);
    await user.click(screen.getByRole('button', { name: 'Sofas' }));
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.getByText('No pieces found')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getAllByRole('article')).toHaveLength(21);
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('none');
  });

  it('adds samples and repeated IKEA products to shared placements and prices, then removes and clears', async () => {
    const user = userEvent.setup();
    render(<App />);
    const selection = screen.getByRole('region', { name: /Your room, piece by piece/ });
    const canvas = screen.getByRole('region', { name: 'Future interactive 3D room planner' });
    const sample = furnitureProducts[0];
    const desk = furnitureProducts[17];
    await user.click(screen.getByRole('button', { name: `Add ${sample.title} to your room` }));
    await user.click(screen.getByRole('button', { name: `Add ${desk.title} to your room` }));
    await user.click(screen.getByRole('button', { name: `Add ${desk.title} to your room` }));
    expect(within(selection).getAllByRole('listitem')).toHaveLength(3);
    expect(within(selection).getByText('$1,518.98')).toBeTruthy();
    expect(within(canvas).getByText('3 pieces selected')).toBeTruthy();
    expect(within(selection).getAllByRole('link', { name: /View selected MICKE/ })).toHaveLength(2);
    await user.type(screen.getByRole('searchbox', { name: 'Search furniture' }), 'Haven');
    await user.click(screen.getByRole('button', { name: 'Beds' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort by price' }), 'desc');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(within(selection).getAllByRole('listitem')).toHaveLength(3);
    expect(within(selection).getByText('$1,518.98')).toBeTruthy();
    await user.click(within(selection).getByRole('button', { name: `Remove ${desk.title}, piece 2` }));
    expect(within(selection).getAllByRole('listitem')).toHaveLength(2);
    expect(within(selection).getByText('$1,408.99')).toBeTruthy();
    await user.click(within(selection).getByRole('button', { name: 'Clear all' }));
    expect(within(selection).queryAllByRole('listitem')).toHaveLength(0);
    expect(within(selection).getByText('$0')).toBeTruthy();
    expect(within(canvas).getByText('0 pieces selected')).toBeTruthy();
  });

  it('shows image-unavailable fallbacks when an external product image fails', () => {
    render(<FurnitureCatalog products={[furnitureProducts[15]]} placedItems={[]} onAddProduct={() => {}} />);
    fireEvent.error(screen.getByRole('img', { name: furnitureProducts[15].title }));
    expect(screen.getByRole('img', { name: `${furnitureProducts[15].title}: image unavailable` })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Add KIVIK/ })).toBeTruthy();
  });
});
