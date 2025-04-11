import { useMemo, useEffect, useRef, useCallback } from 'react';

// Types
type EventType = 'init' | 'get' | 'set' | 'remove' | 'clear';

interface StorageFunctions {
  /**
   * Set the data, generally this should be an empty version of the data type
   *
   * @param key key to be used in the storage table
   * @param data data to be passed in to the storage table as the value
   *
   * @example storage.init('table_name', [])
   *
   * @event `init` the key is passed through
   */
  init: <T>(key: string, data: T) => void;
  /**
   * Set the data, generally you will need to get the data modify it then set it.
   *
   * @param key key to be used in the storage table
   * @param data data to be passed in to the storage table as the value
   *
   * @example storage.set('table_name', ['item1','item2'])
   *
   * @event `set` the key is passed through
   */
  set: <T>(key: string, data: T) => void;
  /**
   * Get the data.
   *
   * @param key key to be fetched from the storage table
   *
   * @example const tableName = storage.get('table_name');
   *
   * @event `get` the key is passed through
   *
   * @returns contents of selected key
   */
  get: <T>(key: string) => T | undefined;
  /**
   * Remove a specific key and its contents.
   *
   * @param key key to be cleared from the storage table
   *
   * @example storage.remove('table_name');
   *
   * @event `remove` the key is passed through
   */
  remove: (key: string) => void;
  /**
   * Remove all items from storage
   *
   * @example storage.clear();
   *
   * @event `clear` the key is passed through
   */
  clear: () => void;
  /**
   * Add event listener for when this component is used.
   *
   * @param event name of event triggered by function
   * @param func a callback function to be called when event matches
   *
   * @example storage.on('set', (key) => {
   *   const data = storage.get(key);
   *   console.log(data);
   * })
   */
  on: (event: EventType, callback: (key?: string) => void) => void;
  /**
   * Add event listener for when this component is used.
   *
   * @param event name of event triggered by function
   * @param func a callback function to be called when event matches
   *
   * @example storage.addEventListener('set', (key) => {
   *   const data = storage.get(key);
   *   console.log(data);
   * })
   */
  addEventListener: (event: EventType, callback: (key?: string) => void) => void;
  /**
   * Add event listener, for all events, for when this component is used.
   *
   * @param func a callback function to be called when any event is triggered
   *
   * @example storage.onAny((event, key) => {
   *   if(event === 'remove' || event === 'clear') return undefined;
   *
   *   const data = storage.get(key);
   *   console.log(data);
   * })
   */
  onAny: (callback: (event?: EventType, key?: string) => void) => void;
  /**
   * If you exactly match an `on` event you can remove it
   *
   * @param event matching event name
   * @param func matching function
   */
  off: (key: string, callback: (key: string) => void) => void;
  /**
   * If you exactly match an `addEventListener` event you can remove it
   *
   * @param event matching event name
   * @param func matching function
   */
  removeEventListener: (key: string, callback: (key: string) => void) => void;
  /**
   * If you exactly match an `onAny` function you can remove it
   *
   * @param func matching function
   */
  offAny: (callback: (key: string) => void) => void;
}

/**
 * A hook to allow getting and setting items to storage, hook comes
 * with context and also event listener like functionality
 *
 * @param type either local or session
 *
 * @example
 * const storage = useLocalStorage('session');
 * <StorageContext.Provider value={storage}>...</StorageContext.Provider>
 */
export default function useLocalStorage(type: 'local' | 'session') {
  const storageType = useMemo<globalThis.Storage | undefined>(
    () => (typeof window === 'undefined' ? undefined : window[`${type}Storage`]),
    [type],
  );

  const onList = useRef<Array<{ event: EventType; callback: (key?: string) => void }>>([]);
  const onAnyList = useRef<Array<{ callback: (event?: EventType, key?: string) => void }>>([]);

  /**
   * Fire the callback for a specific event
   *
   * @param event event to be fired
   * @param key key to be passed through to the callback
   */
  const fireCallback = useCallback((event: EventType, key?: string) => {
    for (const obj of onList.current) obj.event === event && obj.callback(key);
    for (const obj of onAnyList.current) obj.callback(event, key);
  }, []);
  // Listen for different windows changing storage
  useEffect(() => {
    if (!storageType) return;

    /**
     * Set up a listener for if another window updates storage
     * Only fires events for `init`, `set` and `remove`
     *
     * @param event event from listener
     */
    const handleStorage = (event: StorageEvent) => {
      const { key, oldValue, newValue } = event;

      if (!key || key.match(/^(\$\$)(.*)(_data)$/)) return;

      if (oldValue === null && newValue !== null) {
        fireCallback('init', key);
      } else if (oldValue !== null && newValue !== null) {
        fireCallback('set', key);
      } else if (oldValue !== null && newValue === null) {
        fireCallback('remove', key);
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => window.removeEventListener('storage', handleStorage);
  }, [storageType, fireCallback]);

  // Prevent rerun on parent redraw
  return useMemo<StorageFunctions>(
    () => ({
      init: (key, data): void => {
        const type = typeof data;

        storageType!.setItem(key, type === 'object' ? JSON.stringify(data) : String(data));
        storageType!.setItem(`$$${key}_data`, type);
        fireCallback('init', key);
      },

      set: (key, data) => {
        const type = typeof data;

        storageType?.setItem(key, type === 'object' ? JSON.stringify(data) : String(data));
        storageType?.setItem(`$$${key}_data`, type);
        fireCallback('set', key);
      },

      get: (key) => {
        const type = storageType?.getItem(`$$${key}_data`) as string;
        const data = storageType?.getItem(key) as string;

        fireCallback('get', key);

        switch (type) {
          case 'object':
            return JSON.parse(data);
          case 'number':
            return parseFloat(data);
          case 'boolean':
            return data === 'true';
          case 'undefined':
            return undefined;
          default:
            return data;
        }
      },

      remove: (key) => {
        storageType!.removeItem(key);
        storageType!.removeItem(`$$${key}_data`);

        fireCallback('remove', key);
      },

      clear: () => {
        storageType!.clear();

        fireCallback('clear');
      },

      on: (event, callback) => {
        onList.current.push({ event, callback });
      },

      addEventListener: (event, callback) => {
        onList.current.push({ event, callback });
      },

      onAny: (callback) => {
        onAnyList.current.push({ callback });
      },

      off: (event, callback) => {
        const remove = onList.current.indexOf(
          onList.current.filter((e) => e.event === event && e.callback === callback)[0],
        );
        if (remove >= 0) onList.current.splice(remove, 1);
      },

      removeEventListener: (event, callback) => {
        const remove = onList.current.indexOf(
          onList.current.filter((e) => e.event === event && e.callback === callback)[0],
        );
        if (remove >= 0) onList.current.splice(remove, 1);
      },

      offAny: (callback) => {
        const remove = onAnyList.current.indexOf(onAnyList.current.filter((e) => e.callback === callback)[0]);
        if (remove >= 0) onAnyList.current.splice(remove, 1);
      },
    }),
    [storageType],
  );
}
