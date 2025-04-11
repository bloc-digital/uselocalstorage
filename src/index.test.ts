import { renderHook } from '@testing-library/react';

import useLocalStorage from './useLocalStorage';

describe('Hook should be able to store data in storage', () => {
  it('init data and then read it', () => {
    const { result } = renderHook(() => useLocalStorage('session'));

    result.current.init('ping', 'pong');

    expect(result.current.get<string>('ping')).toBe('pong');
  });

  it('Event listeners should fire on set', () => {
    const { result } = renderHook(() => useLocalStorage('session'));

    let output: string | undefined;

    result.current.addEventListener('init', (key) => (output = key));
    result.current.init('ping', 'pong');

    expect(output).toBe('ping');
  });
});
