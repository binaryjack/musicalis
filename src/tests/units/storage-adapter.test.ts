import { describe, test, expect } from '@jest/globals';

interface StorageData {
  [key: string]: string;
}

export const createStorageAdapter = function() {
  const storage: StorageData = {};

  const adapter = {
    setItem: function(key: string, value: string): void {
      storage[key] = value;
    },

    getItem: function(key: string): string | null {
      return storage[key] || null;
    },

    removeItem: function(key: string): void {
      delete storage[key];
    },

    clear: function(): void {
      Object.keys(storage).forEach(key => delete storage[key]);
    },

    getAllKeys: function(): string[] {
      return Object.keys(storage);
    },

    exists: function(key: string): boolean {
      return key in storage;
    }
  };

  return adapter;
};

describe('storage-adapter basic-operations', () => {
  test('stores-and-retrieves-string-value', () => {
    const adapter = createStorageAdapter();
    adapter.setItem('test-key', 'test-value');
    expect(adapter.getItem('test-key')).toBe('test-value');
  });

  test('returns-null-for-missing-key', () => {
    const adapter = createStorageAdapter();
    expect(adapter.getItem('nonexistent')).toBeNull();
  });

  test('removes-stored-item', () => {
    const adapter = createStorageAdapter();
    adapter.setItem('test-key', 'test-value');
    adapter.removeItem('test-key');
    expect(adapter.getItem('test-key')).toBeNull();
  });

  test('overwrites-existing-value', () => {
    const adapter = createStorageAdapter();
    adapter.setItem('test-key', 'value-1');
    adapter.setItem('test-key', 'value-2');
    expect(adapter.getItem('test-key')).toBe('value-2');
  });
});

describe('storage-adapter bulk-operations', () => {
  test('clears-all-stored-data', () => {
    const adapter = createStorageAdapter();
    adapter.setItem('key-1', 'value-1');
    adapter.setItem('key-2', 'value-2');
    
    adapter.clear();
    
    expect(adapter.getItem('key-1')).toBeNull();
    expect(adapter.getItem('key-2')).toBeNull();
  });

  test('lists-all-stored-keys', () => {
    const adapter = createStorageAdapter();
    adapter.setItem('key-1', 'value-1');
    adapter.setItem('key-2', 'value-2');
    adapter.setItem('key-3', 'value-3');
    
    const keys = adapter.getAllKeys();
    expect(keys).toHaveLength(3);
    expect(keys).toContain('key-1');
    expect(keys).toContain('key-2');
    expect(keys).toContain('key-3');
  });

  test('returns-empty-array-for-no-keys', () => {
    const adapter = createStorageAdapter();
    expect(adapter.getAllKeys()).toEqual([]);
  });
});

describe('storage-adapter key-existence', () => {
  test('detects-existing-key', () => {
    const adapter = createStorageAdapter();
    adapter.setItem('test-key', 'test-value');
    expect(adapter.exists('test-key')).toBe(true);
  });

  test('detects-missing-key', () => {
    const adapter = createStorageAdapter();
    expect(adapter.exists('nonexistent')).toBe(false);
  });

  test('detects-removed-key', () => {
    const adapter = createStorageAdapter();
    adapter.setItem('test-key', 'test-value');
    adapter.removeItem('test-key');
    expect(adapter.exists('test-key')).toBe(false);
  });
});