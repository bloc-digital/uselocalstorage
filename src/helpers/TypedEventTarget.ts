type TypedEventListener<E> = (evt: CustomEvent<E>) => void;

type TypedEventListenerObject<E> = {
  handleEvent(evt: CustomEvent<E>): void;
};

// The listener receives the CustomEvent carrying our typed detail payload.
type TEL<E> = TypedEventListener<E> | TypedEventListenerObject<E>;

export class TypedEventTarget<M extends Record<string, unknown>> {
  private readonly target = new EventTarget();

  addEventListener<K extends keyof M>(
    type: K & string,
    listener: TEL<M[K]>,
    options?: boolean | AddEventListenerOptions,
  ) {
    this.target.addEventListener(type, listener as EventListenerOrEventListenerObject, options);
  }

  removeEventListener<K extends keyof M>(
    type: K & string,
    listener: TEL<M[K]>,
    options?: boolean | EventListenerOptions,
  ) {
    this.target.removeEventListener(type, listener as EventListenerOrEventListenerObject, options);
  }

  dispatchEvent<K extends keyof M>(type: K, ...args: M[K] extends void ? [detail?: undefined] : [detail: M[K]]) {
    const [detail] = args;

    return this.target.dispatchEvent(new CustomEvent(String(type), { detail }));
  }
}
