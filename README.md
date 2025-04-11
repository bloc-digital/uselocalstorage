# uselocalstorage

> Handle interaction with local and session storage

## Install

```bash
npm install --save @blocdigital/uselocalstorage
```

## Usage

### API

| Function            | Params                                                                                                          | Description                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| init                | \<T\>(key: `string`, data: `unknown`) => `void`                                                                 | Set the data, generally this should be an empty version of the data type     |
| set                 | \<T\>(key: `string`, data: `unknown`) => `void`                                                                 | Set the data, generally you will need to get the data modify it then set it. |
| get                 | \<T\>(key: `string`) => T \| `undefined`                                                                        | Get the data.                                                                |
| remove              | (key: `string`) => `void`                                                                                       | Remove a specific key and its contents.                                      |
| clear               | () => `void`                                                                                                    | Remove all items from storage                                                |
| addEventListener    | (event: `EventType`, callback: (key?: `string`) => `void`, { signal?: AbortSignal, once?: boolean }) => `void`  | Add as event listener for when this hook is used.                            |
| on                  | (event: `EventType`, callback: (key?: `string`) => `void`, { signal?: AbortSignal, once?: boolean }) => `void`  | Pseudonym for addEventListener                                               |
| onAny               | (callback: (event?: `EventType`, key?: `string`) => `void`, { signal?: AbortSignal, once?: boolean }) => `void` | Add event listener, for all events, for when this hook is used               |
| removeEventListener | (key: `string`, callback: (key: `string`) => `void`) => `void`                                                  | If you exactly match an addEventListener event you can remove it             |
| off                 | (key: `string`, callback: (key: `string`) => `void`) => `void`                                                  | Pseudonym for removeEventListener                                            |
| offAny              | (callback: (key: `string`) => `void`) => `void`                                                                 | If you exactly match an onAny function you can remove it                     |

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
    storage.init('state', 'hello world');
  }, [storage]);

  // set up listeners to keep state in sync with storage
  useEffect(() => {
    const ac = new AbortController();

    storage.addEventListener('set', (key) => key === 'state' && setState(storage.get(key)), { signal: ac.signal });

    // remember to tidy up you event listeners
    return () => ac.abort();
  }, [storage]);

  return (
    <div>
      <span>Current state: {state}</span>
      <br />
      <button onClick={() => storage.set('state', String(Date.now()))}>Change State</button>
    </div>
  );
};
```
