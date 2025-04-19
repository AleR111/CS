import { equal } from "node:assert";

interface LinkedList<T> {
  value: T;
  next: LinkedList<T> | null;
}

class Hashmap {
  size: number = 0;

  buffer: Array<LinkedList<[unknown, unknown]> | null>;

  constructor(capacity: number) {
    this.buffer = new Array(capacity).fill(null);
  }

  entry(key: unknown) {
    const i = this.#getBufferIndex(key);

    return {
      has: () => {
        const cell = this.buffer[i];

        if (cell == null) {
          return false;
        }

        let el: typeof cell | null = cell;

        do {
          if (el.value[0] === key) {
            return true;
          }

          el = el.next;
        } while (el != null);

        return false;
      },

      get: () => {
        const cell = this.buffer[i];

        if (cell == null) {
          return undefined;
        }

        let el: typeof cell | null = cell;

        do {
          if (el.value[0] === key) {
            return el.value[1];
          }

          el = el.next;
        } while (el != null);

        return undefined;
      },

      set: (value: unknown) => {
        if (this.size > this.buffer.length / 2) {
          this.#rehash();
        }

        const cell = this.buffer[i];

        if (cell == null) {
          this.size++;
          this.buffer[i] = { value: [key, value], next: null };
          return;
        }

        let el = cell;

        while (true) {
          if (el.value[0] === key) {
            el.value[1] = value;
            return;
          }

          if (el.next == null) {
            this.size++;
            el.next = { value: [key, value], next: null };
            return;
          }

          el = el.next;
        }
      },

      delete: () => {
        const cell = this.buffer[i];

        if (cell == null) {
          return;
        }

        let el: typeof cell | null = cell,
          prev = el;

        do {
          if (el.value[0] === key) {
            this.size--;

            if (el === prev) {
              this.buffer[i] = null;
            } else {
              prev.next = el.next;
            }
          }

          prev = el;
          el = el.next;
        } while (el != null);
      },
    };
  }

  has(key: unknown): boolean {
    return this.entry(key).has();
  }

  get(key: unknown): unknown {
    return this.entry(key).get();
  }

  set(key: unknown, value: unknown) {
    this.entry(key).set(value);
  }

  delete(key: unknown) {
    this.entry(key).delete();
  }

  *entries(): IterableIterator<[unknown, unknown]> {
    for (const cell of this.buffer) {
      if (cell == null) {
        continue;
      }

      let el: typeof cell | null = cell;

      do {
        yield el.value;
        el = el.next;
      } while (el != null);
    }
  }

  *keys(): IterableIterator<unknown> {
    for (const [key] of this.entries()) {
      yield key;
    }
  }

  *values(): IterableIterator<unknown> {
    for (const [_, value] of this.entries()) {
      yield value;
    }
  }

  #rehash(newCapacity: number = this.buffer.length * 2) {
    const entries = [...this.entries()];

    this.buffer = new Array(newCapacity).fill(null);

    for (const [key, value] of entries) {
      this.set(key, value);
    }
  }

  #getBufferIndex(key: unknown) {
    let hash: number;

    switch (typeof key) {
      case "number":
        hash = hashNumber(key);
        break;

      case "string":
        hash = hashString(key);
        break;

      case "function":
      case "object":
        hash = hashObject(key);
        break;

      default:
        hash = hashString(String(key));
    }

    return hash % this.buffer.length;
  }
}

function hashString(str: string) {
  let hash = 5381;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) + hash + char;
  }

  return hash;
}

const GetObjectHash = Symbol("GetObjectHash");

function hashObject(obj: object | null): number {
  if (obj === null) {
    return 0;
  }

  if (GetObjectHash in obj) {
    return obj[GetObjectHash] as number;
  }

  const value = (Math.random() * 1000) >>> 0;

  Object.defineProperty(obj, GetObjectHash, {
    enumerable: false,
    configurable: false,
    writable: false,
    value,
  });

  return value;
}

function hashNumber(num: number): number {
  return num;
}

const map = new Hashmap(15);

map.set("foobar", 42);
map.set(0, 1);
map.set(1, 2);

console.log(map.get("foobar"));
