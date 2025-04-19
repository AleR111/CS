// function laugh() {
//   console.log("Ha-ha!");
// }

// function debounce(fn: () => void, time: number) {
//   let timer: NodeJS.Timeout | null = null;

//   return () => {
//     if (timer) {
//       clearTimeout(timer);
//     }

//     timer = setTimeout(fn, time);
//   };
// }

// const debouncedLaugh = debounce(laugh, 300);

// debouncedLaugh();
// debouncedLaugh();
// debouncedLaugh();
// debouncedLaugh();
// debouncedLaugh(); // Выполнится через 300 мс

// function throttle(fn: () => void, time: number) {
//   let inThrottle = false;

//   return () => {
//     if (!inThrottle) {
//       fn();
//       inThrottle = true;

//       setTimeout(() => (inThrottle = false), time);
//     }
//   };
// }

// const throttledLaugh = throttle(laugh, 300);

// throttledLaugh(); // Выполнится сразу
// throttledLaugh();
// throttledLaugh();
// throttledLaugh();
// throttledLaugh(); // Выполнится через 300 мс

class EventEmitter {
  events: Map<string, Set<Function>> = new Map();
  onceEvents: Map<string, { fn: Function; value: any }> = new Map();

  add<T, R>(name: string, fn: (args: T) => R) {
    if (this.events.has(name)) {
      this.events.get(name)?.add(fn);
    } else {
      this.events.set(name, new Set([fn]));
    }
  }

  off(name: string, fn?: Function) {
    if (!fn) {
      this.events.delete(name);
    } else {
      // const handler = this.events.get(name).
      // this.events.get(name)?.delete(fn);

      const set = this.events.get(name);
      if (!set) return;

      for (const storedFn of set) {
        if (storedFn === fn || (storedFn as any).__original === fn) {
          set.delete(storedFn);
          break;
        }
      }
    }
  }

  once(name: string, fn: Function) {
    const wrapper = (...args: any[]) => {
      fn(...args);
      this.off(name, fn);
    };

    wrapper.__original = fn;
    this.add(name, wrapper);
  }

  emit(name: string, ...args: any[]) {
    for (const fn of this.events.get(name) ?? []) {
      fn(...args);
    }
  }
}

const ee = new EventEmitter();

ee.once("foo", console.log); // Сработает только один раз
// ee.add("foo", console.log); // Сработает только один раз
ee.add("foo", (arg) => console.log(arg)); // Сработает только один раз
ee.add("foo", (arg) => console.log(arg)); // Сработает только один раз

ee.emit("foo", 1);
// ee.off("foo", console.log); // Отмена конкретного обработчика события по ссылке
// ee.off("foo"); // Отмена всех обработчиков этого события

ee.emit("foo", 2);

function waterfall(handlers: Iterable<any>, fn: Function) {
  const iterator = handlers[Symbol.iterator]();

  // const cb = (err: any, ...results: any[]) => {
  //   if (err) return fn(err);
  //   next(...results);
  // };

  function next(err?: any, ...args: any[]) {
    const { value: handler, done } = iterator.next();

    if (err) return fn(err);
    if (done) {
      return fn(null, ...args); // Всё закончено, вызываем финальный callback
    }

    handler(...args, next); // Далее — передаём аргументы + cb
  }

  next(); // запускаем цепочку
}

waterfall(
  [
    (cb: any) => {
      cb(null, "one", "two");
    },

    (arg1: any, arg2: any, cb: any) => {
      console.log(arg1); // one
      console.log(arg2); // two
      setTimeout(() => cb(null, "three"), 2000);
    },

    (arg1: any, cb: any) => {
      console.log(arg1); // three
      cb(null, "done");
    },
  ],
  (err: any, result: any) => {
    console.log(result); // done
  }
);

waterfall(
  new Set([
    (cb: any) => {
      cb("ha-ha!");
    },

    (arg1: any, cb: any) => {
      cb(null, "done");
    },
  ]),
  (err: any, result: any) => {
    console.log(err); // ha-ha!
    console.log(result); // undefined
  }
);
