/**
 * Storage adapter interface for dependency injection
 * Allows swapping between localStorage, IndexedDB, and database implementations
 */
export interface IStorageAdapter {
  save(key: string, data: unknown): Promise<void>;
  load(key: string): Promise<unknown | null>;
  clear(key?: string): Promise<void>;
  getUsagePercent(): Promise<number>;
}
