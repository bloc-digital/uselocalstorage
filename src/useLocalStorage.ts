import { useMemo, useEffect } from 'react';

const onList: { type: string; callback: Function }[] = [];
const onAnyList: { callback: Function }[] = [];

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
  init: (key: string, data: unknown) => void;
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
  set: (key: string, data: unknown) => void;
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
  get: (key: string) => unknown;
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
   *   console.log(data)
   * })
   */
  on: (key: string, callback: (key: string) => void) => void;
  /**
   * Add event listener, for all events, for when this component is used.
   *
   * @param func a callback function to be called when any event is triggered
   *
   * @example storage.onAny((key) => {
   *   const data = storage.get(key);
   *   console.log(data)
   * })
   */
  onAny: (callback: (key: string) => void) => void;
  /**
   * If you exactly match an `on` event you can remove it
   *
   * @param event matching event name
   * @param func matching function
   */
  off: (key: string, callback: (key: string) => void) => void;
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
  const storageType = useMemo<globalThis.Storage | undefined>(() => {
    if (!window) return undefined;

    return window[`${type}Storage`];
  }, [type]);

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

      if (key && key.match(/^(\$\$)(.*)(_data)$/)) return;

      if (oldValue === null && newValue !== null) {
        onList.filter((obj) => obj.type === 'init').forEach((obj) => obj.callback(key));
        onAnyList.forEach((obj) => obj.callback('init', key));
      } else if (oldValue !== null && newValue !== null) {
        onList.filter((obj) => obj.type === 'set').forEach((obj) => obj.callback(key));
        onAnyList.forEach((obj) => obj.callback('set', key));
      } else if (oldValue === null && newValue !== null) {
        onList.filter((obj) => obj.type === 'remove').forEach((obj) => obj.callback(key));
        onAnyList.forEach((obj) => obj.callback('remove', key));
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => window.removeEventListener('storage', handleStorage);
  });

  // Prevent rerun on parent redraw
  return useMemo<StorageFunctions>(() => {
    return {
      init: (key, data): void => {
        const type = typeof data;
        if (type === 'object') {
          data = JSON.stringify(data);
        }
        storageType!.setItem(key, String(data));
        storageType!.setItem(`$$${key}_data`, type);
        onList.filter((obj) => obj.type === 'init').forEach((obj) => obj.callback(key));
        onAnyList.forEach((obj) => obj.callback('init', key));
      },

      set: (key, data) => {
        const type = typeof data;
        if (type === 'object') {
          data = JSON.stringify(data);
        }
        storageType?.setItem(key, String(data));
        storageType?.setItem(`$$${key}_data`, type);
        onList.filter((obj) => obj.type === 'set').forEach((obj) => obj.callback(key));
        onAnyList.forEach((obj) => obj.callback('set', key));
      },

      get: (key) => {
        const type = storageType?.getItem(`$$${key}_data`) as string;
        const data = storageType?.getItem(key) as string;

        onList.filter((obj) => obj.type === 'get').forEach((obj) => obj.callback(key));
        onAnyList.forEach((obj) => obj.callback('get', key));

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
        onList.filter((obj) => obj.type === 'remove').forEach((obj) => obj.callback(key));
        onAnyList.forEach((obj) => obj.callback('remove', key));
      },

      clear: () => {
        storageType!.clear();
        onList.filter((obj) => obj.type === 'clear').forEach((obj) => obj.callback());
        onAnyList.forEach((obj) => obj.callback('clear'));
      },

      on: (event, callback) => {
        onList.push({ type: event, callback: callback });
      },

      onAny: (callback) => {
        onAnyList.push({ callback: callback });
      },

      off: (event, callback) => {
        const remove = onList.indexOf(onList.filter((e) => e.type === event && e.callback === callback)[0]);
        if (remove >= 0) onList.splice(remove, 1);
      },

      offAny: (callback) => {
        const remove = onAnyList.indexOf(onAnyList.filter((e) => e.callback === callback)[0]);
        if (remove >= 0) onAnyList.splice(remove, 1);
      },
    };
  }, [storageType]);
}
