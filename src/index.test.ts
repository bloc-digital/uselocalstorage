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

  it('should remove data from storage', () => {
    const { result } = renderHook(() => useLocalStorage('session'));

    result.current.init('testKey', 'testValue');
    expect(result.current.get('testKey')).toBe('testValue');

    result.current.remove('testKey');
    expect(result.current.get('testKey')).toBe(null);
  });

  it('should clear all data from storage', () => {
    const { result } = renderHook(() => useLocalStorage('session'));

    result.current.init('key1', 'value1');
    result.current.init('key2', 'value2');
    expect(result.current.get('key1')).toBe('value1');
    expect(result.current.get('key2')).toBe('value2');

    result.current.clear();
    expect(result.current.get('key1')).toBe(null);
    expect(result.current.get('key2')).toBe(null);
  });

  it('should update existing data in storage', () => {
    const { result } = renderHook(() => useLocalStorage('session'));

    result.current.init('updateKey', 'initialValue');
    expect(result.current.get('updateKey')).toBe('initialValue');

    result.current.init('updateKey', 'updatedValue');
    expect(result.current.get('updateKey')).toBe('updatedValue');
  });

  it('should return null for non-existent key', () => {
    const { result } = renderHook(() => useLocalStorage('session'));

    expect(result.current.get('nonExistentKey')).toBe(null);
  });

  it('should see all events fired when setting an on all', () => {
    const { result } = renderHook(() => useLocalStorage('session'));
    const events: { [event: string]: unknown } = {};

    result.current.onAny((event, key) => {
      if (event) events[event] = key;
    });

    result.current.init('ping', 'pong');
    result.current.set('ping', 'pong2');
    result.current.get('ping');
    result.current.remove('ping');
    result.current.clear();

    expect(events.init).toBe('ping');
    expect(events.set).toBe('ping');
    expect(events.get).toBe('ping');
    expect(events.remove).toBe('ping');
    expect(events.clear).toBe(undefined);
  });
});
