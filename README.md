# uselocalstorage

> Handle interaction with local and session storage

## Install

```bash
npm install --save @blocdigital/uselocalstorage
```

## Usage

```tsx
import {useState, useEffect} from 'react';

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
    const onStateChange = (key) => {
      if(key !== 'state') return;

      setState(storage.get(key));
    }

    storage.on('set', onStateChange);

    // remember to tidy up you event listeners
    return () => storage.off('set', onStateChange);
  }, [storage]);


  return (
    <div>
      <span>Current state: {state}</span>
      <br />
      <button onClick={()=>{
        storage.set('state', String(Date.now()));
      }}>
        Change State
      </button>
    </div>
  );
};
```
