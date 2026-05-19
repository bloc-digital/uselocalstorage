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

const JSONParseWithFallback = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export class StorageEvents extends TypedEventTarget<StorageEventsMap> {
  private readonly storage: Storage;
  private readonly abortController = new AbortController();

  constructor(type: 'local' | 'session') {
    super();

    this.storage = type === 'local' ? window.localStorage : window.sessionStorage;
    this.trackChanges();
  }

  /**
   * Parse the value from storage based on the stored type information.
   * @param key The key to retrieve from the storage.
   * @param value The raw string value retrieved from the storage.
   * @returns The value converted to its original type based on the stored type information.
   */
  private parseValue(key: string, value: string | null) {
    const type = this.storage.getItem(`$$${key}_data`);

    switch (type) {
      case 'object':
        return value ? JSONParseWithFallback(value) : null;
      case 'number':
        return value ? Number(value) : null;
      case 'boolean':
        return value === 'true';
      case 'undefined':
        return undefined;
      default:
        return value;
    }
  }

  /**
   * Track changes to the storage across different tabs/windows and dispatch corresponding events.
   */
  private trackChanges() {
    window.addEventListener(
      'storage',
      (event) => {
        const { key, oldValue, newValue, storageArea } = event;

        // Ignore events that are not related to the current storage or that are related to internal type tracking keys
        if (storageArea !== this.storage || key?.match(/^(\$\$)(.*)(_data)$/)) return;

        // Handle clear event when key is null
        if (key === null) {
          this.dispatchEvent('clear');
          this.dispatchEvent('any', { event: 'clear' });

          return;
        }

        const parsedNewValue = this.parseValue(key, newValue);

        if (oldValue === null && newValue !== null) {
          this.dispatchEvent('init', { key, value: parsedNewValue });
          this.dispatchEvent('any', { event: 'init', key, value: parsedNewValue });
        } else if (oldValue !== null && newValue !== null) {
          this.dispatchEvent('set', { key, value: parsedNewValue });
          this.dispatchEvent('any', { event: 'set', key, value: parsedNewValue });
        } else if (oldValue !== null && newValue === null) {
          this.dispatchEvent('remove', { key });
          this.dispatchEvent('any', { event: 'remove', key });
        }
      },
      { signal: this.abortController.signal },
    );
  }

  /**
   * Write a value to the storage with the specified type and dispatch corresponding events. This method is used internally by both init and set methods to avoid code duplication.
   * @param type The type of the event to dispatch ('init' or 'set').
   * @param key The key to set in the storage.
   * @param value The value to associate with the key. The type of the value will be stored to ensure correct retrieval later.
   */
  private writeValue(type: 'init' | 'set', key: string, value: unknown) {
    const valueType = typeof value;

    this.storage.setItem(`$$${key}_data`, valueType);
    this.storage.setItem(key, valueType === 'object' ? JSON.stringify(value) : String(value));
    this.dispatchEvent(type, { key, value });
    this.dispatchEvent('any', { event: type, key, value });
  }

  /**
   * Initialize a key with a value in the storage. This is similar to set, but it can be used to differentiate between initial setting and subsequent updates.
   * @param key The key to initialize in the storage.
   * @param value The value to associate with the key.
   */
  init<T>(key: string, value: T) {
    this.writeValue('init', key, value);
  }

  /**
   * Set a key-value pair in the storage. This will overwrite any existing value for the key and dispatch a 'set' event.
   * @param key The key to set in the storage.
   * @param value The value to associate with the key. The type of the value will be stored to ensure correct retrieval later.
   */
  set<T>(key: string, value: T) {
    this.writeValue('set', key, value);
  }

  /**
   * Get the value associated with a key from the storage. The method will return the value in its original type based on the stored type information. If the key does not exist, it will return null.
   * @param key The key to retrieve from the storage.
   * @returns The value associated with the key, converted to its original type, or null if the key does not exist.
   */
  get<T>(key: string): T | null {
    const rawValue = this.storage.getItem(key);
    const value = this.parseValue(key, rawValue);

    this.dispatchEvent('get', { key, value });
    this.dispatchEvent('any', { event: 'get', key, value });

    return value;
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

  /**
   * Clean up event listeners when the instance is destroyed to prevent memory leaks.
   */
  destroy() {
    this.abortController.abort();
  }
}
