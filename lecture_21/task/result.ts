function random(from: number, to: number): IterableIterator<number> {
  return {
    [Symbol.iterator]() {
      return this;
    },
    next() {
      const value = Math.floor(Math.random() * (to - from + 1)) + from;
      return { value, done: false };
    },
  };
}

const randomInt = random(0, 100);

console.log(randomInt.next());
console.log(randomInt.next());
console.log(randomInt.next());
console.log(randomInt.next());

function take<T>(
  iterator: IterableIterator<T>,
  limit: number
): IterableIterator<T> {
  let i = 0;

  return {
    [Symbol.iterator]() {
      return this;
    },

    next() {
      if (i >= limit) {
        return { value: undefined, done: true };
      }
      i++;

      const nextValue = iterator.next();

      return nextValue.done ? { value: undefined, done: true } : nextValue;
    },
  };
}

console.log([...take(randomInt, 15)]);

function filter<T>(
  iterator: IterableIterator<T>,
  callback: (el: T) => boolean
): IterableIterator<T> {
  return {
    [Symbol.iterator]() {
      return this;
    },

    next() {
      let el;

      do {
        el = iterator.next();

        if (!el.done && callback(el.value)) {
          return { value: el.value, done: false };
        }
      } while (!el.done);

      return { value: undefined, done: true };
    },
  };
}

console.log([
  ...take(
    filter(randomInt, (el) => el > 50),
    15
  ),
]);

function enumerate<T>(
  iterator: IterableIterator<T>
): IterableIterator<[number, T]> {
  let i = 0;

  return {
    [Symbol.iterator]() {
      return this;
    },
    next() {
      const nextValue = iterator.next();

      if (nextValue.done) {
        return nextValue;
      }

      return { value: [i++, nextValue.value], done: false };
    },
  };
}

console.log([...take(enumerate(randomInt), 3)]); // [[0, ...], [1, ...], [2, ...]]

class RangeIter<T> {
  constructor(public from: T, public to: T) {}

  private getNextValue(currentValue: T, increment = 1) {
    switch (typeof currentValue) {
      case "string":
        return String.fromCodePoint(
          currentValue.codePointAt(0)! + increment
        ) as T;
      case "number":
        return (currentValue + increment) as T;
      default:
        return currentValue;
    }
  }

  toIter(): IterableIterator<T> {
    let i = this.from;
    let j: T;

    return {
      [Symbol.iterator]() {
        return this;
      },
      next: () => {
        if (j === this.to) {
          return { value: undefined, done: true };
        }
        j = i;

        const nextValue = { value: i, done: false };
        i = this.getNextValue(i);

        return nextValue;
      },
    };
  }

  reverse(): IterableIterator<T> {
    let i = this.to;
    let j: T;

    return {
      [Symbol.iterator]() {
        return this;
      },
      next: () => {
        if (j === this.from) {
          return { value: undefined, done: true };
        }
        j = i;

        const nextValue = { value: i, done: false };
        i = this.getNextValue(i, -1);

        return nextValue;
      },
    };
  }

  [Symbol.iterator]() {
    return this.toIter();
  }
}

const symbolRange = new RangeIter("a", "f");

console.log(Array.from(symbolRange)); // ['a', 'b', 'c', 'd', 'e', 'f']

const numberRange = new RangeIter(-5, 1);

console.log(Array.from(numberRange.reverse())); // [1, 0, -1, -2, -3, -4, -5]

function seq(...iterators: Iterable<any>[]): IterableIterator<any> {
  let j = 0;
  let i = iterators[j][Symbol.iterator]();

  return {
    [Symbol.iterator]() {
      return this;
    },
    next() {
      while (true) {
        const nextValue = i.next();

        if (nextValue.done && j < iterators.length - 1) {
          j++;
          i = iterators[j][Symbol.iterator]();
          continue;
        }

        return nextValue;
      }
    },
  };
}

console.log(...seq([1, 2], new Set([3, 4]), "bla")); // 1, 2, 3, 4, 'b', 'l', 'a'

function zip(...iterableIterators: Iterable<any>[]): IterableIterator<any> {
  let i = 0;
  const iterators = iterableIterators.map((iter) => iter[Symbol.iterator]());

  return {
    [Symbol.iterator]() {
      return this;
    },
    next() {
      const values = [];
      let isNotDone;
      for (const iter of iterators) {
        const value = iter.next();
        isNotDone ||= !value.done;
        values.push(value.value);
      }

      if (!isNotDone) {
        return { value: undefined, done: true };
      }
      return { value: values, done: false };
    },
  };
}

console.log(...zip([1, 2], new Set([3, 4]), "bla")); // [[1, 3, b], [2, 4, 'l']]

function mapSeq<T>(
  collection: Iterable<T>,
  callbackIters: Iterable<(el: T) => T>
): IterableIterator<T> {
  const iterator = collection[Symbol.iterator]();

  return {
    [Symbol.iterator]() {
      return this;
    },
    next() {
      const nextValue = iterator.next();

      if (nextValue.done) {
        return nextValue;
      }

      let value = nextValue.value;

      for (const callback of callbackIters) {
        value = callback(value);
      }

      return { value, done: false };
    },
  };
}

console.log(...mapSeq([1, 2, 3], [(el) => el * 2, (el) => el - 1])); // [1, 3, 5]
