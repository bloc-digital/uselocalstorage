import { useEffect, useState } from 'react';
import { StorageEvents } from './StorageEvents.js';

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
  const [storage, setStorage] = useState<ExtendedStorageEvents | null>(null);

  useEffect(() => {
    const instance = StorageEvents.acquire(type);

    if (!instance) return;

    const extended = Object.assign(instance, {
      on: instance.addEventListener.bind(instance),
      onAny: (callback: (event: AnyEvent) => void, options?: AddEventListenerOptions) =>
        instance.addEventListener('any', callback, options),
      off: instance.removeEventListener.bind(instance),
      offAny: (callback: (event: AnyEvent) => void, options?: EventListenerOptions) =>
        instance.removeEventListener('any', callback, options),
    }) as ExtendedStorageEvents;

    setStorage(extended);

    return () => StorageEvents.release(type);
  }, [type]);

  return storage;
}
