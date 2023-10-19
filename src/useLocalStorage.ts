import { useMemo, useEffect } from 'react';
import type { StorageFunctions } from './useLocalStorage.interface';

const onList: { type: string; callback: Function }[] = [];
const onAnyList: { callback: Function }[] = [];

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
