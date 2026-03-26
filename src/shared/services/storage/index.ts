import type { IStorageAdapter } from './storageAdapter.interface';
import { LocalStorageAdapter } from './localStorageAdapter';

/**
 * Factory for creating storage adapters
 * Supports swapping implementations based on environment
 */
export const createStorageAdapter = (type: 'localStorage' | 'indexedDB' | 'database' = 'localStorage'): IStorageAdapter => {
  switch (type) {
    case 'localStorage':
      return new LocalStorageAdapter();
    case 'indexedDB':
      // TODO: Implement IndexedDBAdapter for Phase 2
      console.warn('IndexedDB adapter not yet implemented, falling back to localStorage');
      return new LocalStorageAdapter();
    case 'database':
      // TODO: Implement DatabaseAdapter for Phase 3
      console.warn('Database adapter not yet implemented, falling back to localStorage');
      return new LocalStorageAdapter();
    default:
      return new LocalStorageAdapter();
  }
};

export type { IStorageAdapter } from './storageAdapter.interface';
export { LocalStorageAdapter } from './localStorageAdapter';
