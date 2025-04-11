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

  it('should remove specific event listener using off', () => {
    const { result } = renderHook(() => useLocalStorage('session'));

    let output: string | undefined;
    const callback = (key: string | undefined) => (output = key);

    result.current.on('set', callback);
    result.current.off('set', callback);

    result.current.set('testKey', 'testValue');
    expect(output).toBeUndefined();
  });

  it('should remove specific event listener using removeEventListener', () => {
    const { result } = renderHook(() => useLocalStorage('session'));

    let output: string | undefined;
    const callback = (key: string | undefined) => (output = key);

    result.current.addEventListener('set', callback);
    result.current.removeEventListener('set', callback);

    result.current.set('testKey', 'testValue');
    expect(output).toBeUndefined();
  });

  it('should remove onAny listener using offAny', () => {
    const { result } = renderHook(() => useLocalStorage('session'));

    const events: { [event: string]: unknown } = {};
    const callback = (event?: string, key?: string) => {
      if (event) events[event] = key;
    };

    result.current.onAny(callback);
    result.current.offAny(callback);

    result.current.init('key', 'value');
    expect(events.init).toBeUndefined();
  });

  it('should handle multiple listeners for the same event', () => {
    const { result } = renderHook(() => useLocalStorage('session'));

    let output1: string | undefined;
    let output2: string | undefined;

    result.current.on('set', (key) => (output1 = key));
    result.current.on('set', (key) => (output2 = key));

    result.current.set('testKey', 'testValue');
    expect(output1).toBe('testKey');
    expect(output2).toBe('testKey');
  });

  it('should handle once option for on', () => {
    const { result } = renderHook(() => useLocalStorage('session'));

    let callCount = 0;
    result.current.on('set', () => callCount++, { once: true });

    result.current.set('testKey', 'testValue');
    result.current.set('testKey', 'testValue2');
    expect(callCount).toBe(1);
  });

  it('should handle once option for onAny', () => {
    const { result } = renderHook(() => useLocalStorage('session'));

    let callCount = 0;
    result.current.onAny(() => callCount++, { once: true });

    result.current.set('testKey', 'testValue');
    result.current.set('testKey', 'testValue2');
    expect(callCount).toBe(1);
  });

  it('should handle abort signal for on', () => {
    const { result } = renderHook(() => useLocalStorage('session'));

    let output: string | undefined;
    const controller = new AbortController();

    result.current.on('set', (key) => (output = key), { signal: controller.signal });

    controller.abort();
    result.current.set('testKey', 'testValue');
    expect(output).toBeUndefined();
  });

  it('should handle abort signal for onAny', () => {
    const { result } = renderHook(() => useLocalStorage('session'));

    const events: { [event: string]: unknown } = {};
    const controller = new AbortController();

    result.current.onAny(
      (event, key) => {
        if (event) events[event] = key;
      },
      { signal: controller.signal },
    );

    controller.abort();
    result.current.set('testKey', 'testValue');
    expect(events.set).toBeUndefined();
  });

  it('should handle storage event for init', () => {
    const { result } = renderHook(() => useLocalStorage('local'));

    let output: string | undefined;
    result.current.on('init', (key) => (output = key));

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'testKey',
        oldValue: null,
        newValue: 'testValue',
      }),
    );

    expect(output).toBe('testKey');
  });

  it('should handle storage event for set', () => {
    const { result } = renderHook(() => useLocalStorage('local'));

    let output: string | undefined;
    result.current.on('set', (key) => (output = key));

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'testKey',
        oldValue: 'oldValue',
        newValue: 'newValue',
      }),
    );

    expect(output).toBe('testKey');
  });

  it('should handle storage event for remove', () => {
    const { result } = renderHook(() => useLocalStorage('local'));

    let output: string | undefined;
    result.current.on('remove', (key) => (output = key));

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'testKey',
        oldValue: 'oldValue',
        newValue: null,
      }),
    );

    expect(output).toBe('testKey');
  });

  it('should ignore storage events with invalid keys', () => {
    const { result } = renderHook(() => useLocalStorage('local'));

    let output: string | undefined;
    result.current.on('init', (key) => (output = key));

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: '$$invalid_key_data',
        oldValue: null,
        newValue: 'value',
      }),
    );

    expect(output).toBeUndefined();
  });
});
