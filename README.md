# uselocalstorage

> Handle interaction with local and session storage, including change notifications across tabs/windows.

## Install

```bash
npm install --save @blocdigital/uselocalstorage
```

## Usage

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

### Example

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

### Using StorageEvents Directly (Without React)

You can also use `StorageEvents` directly in browser code when you do not need the hook.

```ts
import { StorageEvents } from '@blocdigital/uselocalstorage';

const storage = new StorageEvents('local');
const ac = new AbortController();

// Listen to a specific event
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

// Listen to all events in one place
storage.addEventListener(
  'any',
  (event) => {
    const { event: type, key, value } = event.detail;
    console.log(type, key, value);
  },
  { signal: ac.signal },
);

storage.init('counter', 0);
storage.set('counter', 1);

const current = storage.get<number>('counter');
console.log('Current value:', current);

// Cleanup your listeners when no longer needed
ac.abort();
storage.destroy();
```

This works in plain TypeScript/JavaScript running in the browser, and listeners also receive updates when storage changes in other tabs/windows.
