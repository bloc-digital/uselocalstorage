export interface StorageFunctions {
  /**
   * Set the data, generally this should be an empty version of the data type
   *
   * @param key key to be used in the storage table
   * @param data data to be passed in to the storage table as the value
   *
   * @example storage.init('table_name', [])
   *
   * @event `init` the key is passed through
   */
  init: (key: string, data: unknown) => void;
  /**
   * Set the data, generally you will need to get the data modify it then set it.
   *
   * @param key key to be used in the storage table
   * @param data data to be passed in to the storage table as the value
   *
   * @example storage.set('table_name', ['item1','item2'])
   *
   * @event `set` the key is passed through
   */
  set: (key: string, data: unknown) => void;
  /**
   * Get the data.
   *
   * @param key key to be fetched from the storage table
   *
   * @example const tableName = storage.get('table_name');
   *
   * @event `get` the key is passed through
   *
   * @returns contents of selected key
   */
  get: (key: string) => unknown;
  /**
   * Remove a specific key and its contents.
   *
   * @param key key to be cleared from the storage table
   *
   * @example storage.remove('table_name');
   *
   * @event `remove` the key is passed through
   */
  remove: (key: string) => void;
  /**
   * Remove all items from storage
   *
   * @example storage.clear();
   *
   * @event `clear` the key is passed through
   */
  clear: () => void;
  /**
   * Add event listener for when this component is used.
   *
   * @param event name of event triggered by function
   * @param func a callback function to be called when event matches
   *
   * @example storage.on('set', (key) => {
   *   const data = storage.get(key);
   *   console.log(data)
   * })
   */
  on: (key: string, callback: (key: string) => void) => void;
  /**
   * Add event listener, for all events, for when this component is used.
   *
   * @param func a callback function to be called when any event is triggered
   *
   * @example storage.onAny((key) => {
   *   const data = storage.get(key);
   *   console.log(data)
   * })
   */
  onAny: (callback: (key: string) => void) => void;
  /**
   * If you exactly match an `on` event you can remove it
   *
   * @param event matching event name
   * @param func matching function
   */
  off: (key: string, callback: (key: string) => void) => void;
  /**
   * If you exactly match an `onAny` function you can remove it
   *
   * @param func matching function
   */
  offAny: (callback: (key: string) => void) => void;
}
