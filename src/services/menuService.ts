import { MenuItem } from '../types';
import { storageAdapter } from './storageAdapter';
import { generateEntityId } from './idGenerator';

export const menuService = {
  async listMenuItems(): Promise<MenuItem[]> {
    return storageAdapter.getMenuItems();
  },

  async getMenuItem(id: string): Promise<MenuItem | null> {
    const items = storageAdapter.getMenuItems();
    return items.find((i) => i.id === id) || null;
  },

  async createMenuItem(item: Omit<MenuItem, 'id'> & { id?: string }): Promise<MenuItem> {
    const items = storageAdapter.getMenuItems();
    const newItem: MenuItem = {
      ...item,
      id: item.id || generateEntityId('menu'),
    };

    const updated = [...items, newItem];
    storageAdapter.setMenuItems(updated);
    return newItem;
  },

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem | null> {
    const items = storageAdapter.getMenuItems();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const updatedItem = {
      ...items[index],
      ...updates,
    };

    items[index] = updatedItem;
    storageAdapter.setMenuItems(items);
    return updatedItem;
  },

  async deleteMenuItem(id: string): Promise<boolean> {
    const items = storageAdapter.getMenuItems();
    const filtered = items.filter((i) => i.id !== id);
    storageAdapter.setMenuItems(filtered);
    return true;
  },

  async toggleAvailability(id: string): Promise<MenuItem | null> {
    const items = storageAdapter.getMenuItems();
    const index = items.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const updatedItem = {
      ...items[index],
      available: !items[index].available,
    };

    items[index] = updatedItem;
    storageAdapter.setMenuItems(items);
    return updatedItem;
  },

  async saveMenuItems(items: MenuItem[]): Promise<MenuItem[]> {
    storageAdapter.setMenuItems(items);
    return items;
  },
};
