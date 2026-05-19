# uselocalstorage

> Handle interaction with local and session storage, including change notifications across tabs/windows.

## Install

```bash
npm install --save @blocdigital/uselocalstorage
```

## Usage

### Recommended: Use StorageEvents Directly

`StorageEvents` is the recommended API for new code.

- It works in React and non-React code.
- It provides explicit lifecycle control via `StorageEvents.acquire(...)` and `StorageEvents.release(...)`.
- It is easier to compose into custom hooks and shared state utilities.

### Legacy Hook: useLocalStorage

`useLocalStorage(type)` is still supported, but it is considered legacy.

- Prefer `StorageEvents` directly for new work.
- Keep using the hook where you need backward compatibility.

### Multiple Instances

All calls to `useLocalStorage('local')` share one internal channel, and all calls to `useLocalStorage('session')` share another.

This means:

- Multiple components in the same tab receive the same storage events.
- Different dependencies that bundle this package still talk to each other in the same browser context.
- The shared channel is kept alive until the last consumer unmounts.

### API

| Function            | Params                                                                                                                                              | Description                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| init                | \<T\>(key: `string`, data: `unknown`) => `void`                                                                                                     | Set the data, generally this should be an empty version of the data type      |
| set                 | \<T\>(key: `string`, data: `unknown`) => `void`                                                                                                     | Set the data, generally you will need to get the data modify it then set it.  |
| get                 | \<T\>(key: `string`) => T \| `null`                                                                                                                 | Get the data.                                                                 |
| remove              | (key: `string`) => `void`                                                                                                                           | Remove a specific key and its contents.                                       |
| clear               | () => `void`                                                                                                                                        | Remove all items from storage                                                 |
| addEventListener    | (event: `EventType`, callback: (event: CustomEvent) => `void`, { signal?: AbortSignal, once?: boolean }) => `void`                                  | Add an event listener for storage changes in this tab and other tabs/windows. |
| on                  | (event: `EventType`, callback: (event: CustomEvent) => `void`, { signal?: AbortSignal, once?: boolean }) => `void`                                  | Alias for addEventListener                                                    |
| onAny               | (callback: (event: CustomEvent<{ event: EventType; key?: string; value?: unknown }>) => `void`, { signal?: AbortSignal, once?: boolean }) => `void` | Listen to all storage events in one callback                                  |
| removeEventListener | (event: `EventType`, callback: (event: CustomEvent) => `void`) => `void`                                                                            | Remove a specific event listener                                              |
| off                 | (event: `EventType`, callback: (event: CustomEvent) => `void`) => `void`                                                                            | Alias for removeEventListener                                                 |
| offAny              | (callback: (event: CustomEvent) => `void`) => `void`                                                                                                | Remove an any-event listener                                                  |

Event listeners fire for changes in the current tab and when storage is changed in another tab/window.

### Legacy Hook Example (Supported)

```tsx
import { useState, useEffect } from 'react';

// Hooks
import useLocalStorage from '@blocdigital/uselocalstorage';

const Example = () => {
  const [state, setState] = useState('hello world');

  // initiate the session storage
  const storage = useLocalStorage('session');

  // initialise the storage state
  useEffect(() => {
    storage?.init('state', 'hello world');
  }, [storage]);

  // set up listeners to keep state in sync with storage in this tab and other tabs/windows
  useEffect(() => {
    const ac = new AbortController();

    storage?.addEventListener(
      'set',
      (event) => {
        const key = event.detail?.key;

        if (key === 'state') {
          setState(storage.get('state'));
        }
      },
      { signal: ac.signal },
    );

    // remember to tidy up you event listeners
    return () => ac.abort();
  }, [storage]);

  return (
    <div>
      <span>Current state: {state}</span>
      <br />
      <button onClick={() => storage?.set('state', String(Date.now()))}>Change State</button>
    </div>
  );
};
```

### StorageEvents Directly (Recommended)

Use `StorageEvents.acquire(...)` and `StorageEvents.release(...)` to share one channel per storage type and clean up correctly.

```ts
import { StorageEvents } from '@blocdigital/uselocalstorage';

const storage = StorageEvents.acquire('local');

if (!storage) {
  throw new Error('StorageEvents can only be used in a browser environment.');
}

const ac = new AbortController();

storage.addEventListener(
  'set',
  (event) => {
    const { key, value } = event.detail;

    if (key === 'counter') {
      console.log('Counter updated:', value);
    }
  },
  { signal: ac.signal },
);

storage.init('counter', 0);
storage.set('counter', 1);

const current = storage.get<number>('counter');
console.log('Current value:', current);

// Cleanup when done
ac.abort();
StorageEvents.release('local');
```

### Advanced React Pattern (Class First)

The class API can be composed into a powerful React hook using `useSyncExternalStore`.

```ts
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { StorageEvents } from '@blocdigital/uselocalstorage';

type StorageType = 'local' | 'session';

/**
 * Subscribe to storage changes for a specific key.
 */
const subscribe = (storage: StorageEvents, key: string) => (callback: () => void) => {
  const ac = new AbortController();
  const fireCallback = (event: CustomEvent<{ key: string }>) => {
    if (event.detail.key === key) callback();
  };

  storage.addEventListener('init', fireCallback, { signal: ac.signal });
  storage.addEventListener('set', fireCallback, { signal: ac.signal });
  storage.addEventListener('remove', fireCallback, { signal: ac.signal });
  storage.addEventListener('clear', callback, { signal: ac.signal });

  return () => ac.abort();
};

/**
 * A custom hook to manage state synchronized with localStorage or sessionStorage.
 */
const useStoreState = <T>(name: string, type: StorageType) => {
  const storage = useMemo(() => StorageEvents.acquire(type), [type]);

  useEffect(() => {
    return () => {
      if (storage) StorageEvents.release(type);
    };
  }, [storage, type]);

  const state = useSyncExternalStore(
    storage ? subscribe(storage, name) : () => () => undefined,
    () => (storage ? storage.get<T>(name) : null),
    () => null,
  );

  const setState = useCallback(
    (value: T) => {
      if (storage) storage.set(name, value);
    },
    [name, storage],
  );

  const clearState = useCallback(() => {
    if (storage) storage.remove(name);
  }, [name, storage]);

  return [state, setState, clearState] as const;
};

export const useLocalState = <T>(name: string) => useStoreState<T>(name, 'local');
export const useSessionState = <T>(name: string) => useStoreState<T>(name, 'session');
```

This works in plain TypeScript/JavaScript in the browser and in React apps, and listeners also receive updates when storage changes in other tabs/windows.
