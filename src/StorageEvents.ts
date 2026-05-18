import { TypedEventTarget } from './helpers/TypedEventTarget';

// Types
export type EventKeys = 'init' | 'get' | 'set' | 'remove' | 'clear';

type StorageEventsMap = {
  any: { event: EventKeys; key?: string; value?: unknown };
  init: { key: string; value: unknown };
  get: { key: string; value: unknown };
  set: { key: string; value: unknown };
  remove: { key: string };
  clear: void;
};

export class StorageEvents extends TypedEventTarget<StorageEventsMap> {
  private readonly storage: Storage;

  constructor(type: 'local' | 'session') {
    super();

    this.storage = type === 'local' ? window.localStorage : window.sessionStorage;
    this.trackChanges();
  }

  /**
   * Track changes to the storage across different tabs/windows and dispatch corresponding events.
   */
  private trackChanges() {
    window.addEventListener('storage', (event) => {
      const { key, oldValue, newValue } = event;

      if (!key || key.match(/^(\$\$)(.*)(_data)$/)) return;

      if (oldValue === null && newValue !== null) {
        this.dispatchEvent('init', { key, value: newValue });
        this.dispatchEvent('any', { event: 'init', key, value: newValue });
      } else if (oldValue !== null && newValue !== null) {
        this.dispatchEvent('set', { key, value: newValue });
        this.dispatchEvent('any', { event: 'set', key, value: newValue });
      } else if (oldValue !== null && newValue === null) {
        this.dispatchEvent('remove', { key });
        this.dispatchEvent('any', { event: 'remove', key });
      }
    });
  }

  /**
   * Initialize a key with a value in the storage. This is similar to set, but it can be used to differentiate between initial setting and subsequent updates.
   * @param key The key to initialize in the storage.
   * @param value The value to associate with the key.
   */
  init<T>(key: string, value: T) {
    const type = typeof value;

    this.storage.setItem(key, type === 'object' ? JSON.stringify(value) : String(value));
    this.storage.setItem(`$$${key}_data`, type);
    this.dispatchEvent('init', { key, value });
    this.dispatchEvent('any', { event: 'init', key, value });
  }

  /**
   * Set a key-value pair in the storage. This will overwrite any existing value for the key and dispatch a 'set' event.
   * @param key The key to set in the storage.
   * @param value The value to associate with the key. The type of the value will be stored to ensure correct retrieval later.
   */
  set<T>(key: string, value: T) {
    const type = typeof value;

    this.storage.setItem(key, type === 'object' ? JSON.stringify(value) : String(value));
    this.storage.setItem(`$$${key}_data`, type);
    this.dispatchEvent('set', { key, value });
    this.dispatchEvent('any', { event: 'set', key, value });
  }

  /**
   * Get the value associated with a key from the storage. The method will return the value in its original type based on the stored type information. If the key does not exist, it will return null.
   * @param key The key to retrieve from the storage.
   * @returns The value associated with the key, converted to its original type, or null if the key does not exist.
   */
  get<T>(key: string): T | null {
    const type = this.storage.getItem(`$$${key}_data`);
    const value = this.storage.getItem(key);

    let result: unknown = value;

    switch (type) {
      case 'object':
        result = value ? JSON.parse(value) : null;
        break;
      case 'number':
        result = value ? Number(value) : null;
        break;
      case 'boolean':
        result = value === 'true';
        break;
      case 'undefined':
        result = undefined;
        break;
      default:
        result = value;
    }

    this.dispatchEvent('get', { key, value: result });
    this.dispatchEvent('any', { event: 'get', key, value: result });

    return result as T | null;
  }

  /**
   * Remove a key and its associated type information from the storage. This will dispatch a 'remove' event.
   * @param key The key to remove from the storage.
   */
  remove(key: string) {
    this.storage.removeItem(key);
    this.storage.removeItem(`$$${key}_data`);
    this.dispatchEvent('remove', { key });
    this.dispatchEvent('any', { event: 'remove', key });
  }

  /**
   * Clear all keys and their associated type information from the storage. This will dispatch a 'clear' event.
   */
  clear() {
    this.storage.clear();
    this.dispatchEvent('clear');
    this.dispatchEvent('any', { event: 'clear' });
  }
}
