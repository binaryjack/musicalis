type LocalStorageAdapter = {
  readonly load: (key: string) => Promise<unknown>;
  readonly save: (key: string, data: unknown) => Promise<void>;
  readonly remove: (key: string) => Promise<void>;
  readonly clear: () => Promise<void>;
  readonly keys: () => Promise<string[]>;
};

export const createLocalStorage = function(): LocalStorageAdapter {
  const checkAvailability = function(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  };
  
  const isAvailable = checkAvailability();
  
  const fallbackStorage = new Map<string, string>();
  
  const adapter: LocalStorageAdapter = Object.freeze({
    load: async function(key: string): Promise<unknown> {
      try {
        const data = isAvailable 
          ? localStorage.getItem(key)
          : fallbackStorage.get(key);
        
        if (data === null || data === undefined) {
          return null;
        }
        
        return JSON.parse(data);
      } catch (error) {
        console.error(`Failed to load from storage: ${key}`, error);
        return null;
      }
    },
    
    save: async function(key: string, data: unknown): Promise<void> {
      try {
        const serialized = JSON.stringify(data);
        
        if (isAvailable) {
          localStorage.setItem(key, serialized);
        } else {
          fallbackStorage.set(key, serialized);
        }
      } catch (error) {
        console.error(`Failed to save to storage: ${key}`, error);
        throw error;
      }
    },
    
    remove: async function(key: string): Promise<void> {
      try {
        if (isAvailable) {
          localStorage.removeItem(key);
        } else {
          fallbackStorage.delete(key);
        }
      } catch (error) {
        console.error(`Failed to remove from storage: ${key}`, error);
        throw error;
      }
    },
    
    clear: async function(): Promise<void> {
      try {
        if (isAvailable) {
          localStorage.clear();
        } else {
          fallbackStorage.clear();
        }
      } catch (error) {
        console.error('Failed to clear storage', error);
        throw error;
      }
    },
    
    keys: async function(): Promise<string[]> {
      try {
        if (isAvailable) {
          return Object.keys(localStorage);
        } else {
          return Array.from(fallbackStorage.keys());
        }
      } catch (error) {
        console.error('Failed to get storage keys', error);
        return [];
      }
    },
  });
  
  return adapter;
};