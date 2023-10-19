import { renderHook } from '@testing-library/react';

import useLocalStorage from './index';

describe('Hook should be able to store data in storage', () => {
  it('init data and then read it', () => {
    const { result } = renderHook(() => useLocalStorage('session'));

    result.current.init('ping', 'pong');

    expect(result.current.get('ping')).toBe('pong');
  });
});
