import type { IStorageAdapter } from './storageAdapter.interface';

/**
 * LocalStorage adapter implementation for Phase 1 testing
 * Provides persistence layer with quota management
 */
export const createLocalStorageAdapter = function(): IStorageAdapter {
  const prefix = 'musicalist_';
  const quotaWarningThreshold = 0.85; // 85%

  const save = async function(key: string, data: unknown): Promise<void> {
    try {
      const fullKey = `${prefix}${key}`;
      const serialized = JSON.stringify({
        version: 1,
        timestamp: Date.now(),
        data,
      });

      localStorage.setItem(fullKey, serialized);

      // Check usage and warn if needed
      const usage = await getUsagePercent();
      if (usage > quotaWarningThreshold) {
        console.warn(
          `LocalStorage usage at ${(usage * 100).toFixed(1)}%. Consider exporting and cleaning old projects.`
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'QuotaExceededError') {
          throw new Error('LocalStorage quota exceeded. Export and delete old projects.');
        }
      }
      throw error;
    }
  };

  const load = async function(key: string): Promise<unknown | null> {
    try {
      const fullKey = `${prefix}${key}`;
      const serialized = localStorage.getItem(fullKey);

      if (!serialized) {
        return null;
      }

      const { data, version } = JSON.parse(serialized);

      // Future: Add migration logic based on version
      if (version !== 1) {
        console.warn(`Unknown storage version: ${version}`);
      }

      return data;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  };

  const clear = async function(key?: string): Promise<void> {
    if (key) {
      const fullKey = `${prefix}${key}`;
      localStorage.removeItem(fullKey);
    } else {
      // Clear all musicalist keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }
  };

  const getUsagePercent = async function(): Promise<number> {
    try {
      let totalSize = 0;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(prefix)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      }

      // Approximate quota (5MB typical for most browsers)
      const approximateQuota = 5 * 1024 * 1024; // 5MB
      return totalSize / approximateQuota;
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return 0;
    }
  };

  return Object.freeze({
    save,
    load,
    clear,
    getUsagePercent
  });
};
