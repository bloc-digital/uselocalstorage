import { useEffect, useMemo } from 'react';
import { StorageEvents } from './StorageEvents';

// Types
import type { EventKeys } from './StorageEvents';
type AnyEvent = CustomEvent<{ event: EventKeys; key?: string; value?: unknown }>;

type ExtendedStorageEvents = StorageEvents & {
  on: (
    type: EventKeys,
    callback: (event: CustomEvent<{ key: string; value: unknown }>) => void,
    options?: AddEventListenerOptions,
  ) => void;
  onAny: (callback: (event: AnyEvent) => void, options?: AddEventListenerOptions) => void;
  off: (
    type: EventKeys,
    callback: (event: CustomEvent<{ key: string; value: unknown }>) => void,
    options?: EventListenerOptions,
  ) => void;
  offAny: (callback: (event: AnyEvent) => void, options?: EventListenerOptions) => void;
};

/**
 * A hook to allow getting and setting items in storage with typed events.
 * Events are emitted for local changes and for changes from other tabs/windows.
 *
 * @param type either local or session
 *
 * @example
 * const storage = useLocalStorage('session');
 *
 * // Log key when it's ready
 * useEffect(() => {
 *   if(!storage) return;
 *
 *   const key = storage.get<number>('key');
 *
 *   if(key) {
 *     console.log(key)
 *
 *     return;
 *   }
 *
 *   const ac = new AbortController();
 *
 *   storage.onAny((event) => {
 *     const { event: type, key } = event.detail;
 *
 *     if(key !== 'key') return;
 *
 *     if(type === 'init' || type === 'set') {
 *       console.log(storage.get<number>('key'))
 *
 *       ac.abort();
 *     };
 *   }, {signal: ac.signal});
 *
 *   return () => ac.abort();
 * }, [storage]);
 */
export default function useLocalStorage(type: 'local' | 'session') {
  const storage = useMemo<ExtendedStorageEvents | null>(() => {
    const storage = typeof window === 'undefined' ? undefined : new StorageEvents(type);

    if (!storage) return null;

    return Object.assign(storage, {
      on: storage.addEventListener.bind(storage),
      onAny: (callback: (event: AnyEvent) => void, options?: AddEventListenerOptions) =>
        storage.addEventListener('any', callback, options),
      off: storage.removeEventListener.bind(storage),
      offAny: (callback: (event: AnyEvent) => void, options?: EventListenerOptions) =>
        storage.removeEventListener('any', callback, options),
    }) as ExtendedStorageEvents;
  }, [type]);

  // Cleanup on unmount
  useEffect(() => () => storage?.destroy(), [storage]);

  return storage;
}
