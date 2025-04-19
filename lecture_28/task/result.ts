function curry(fn: Function) {
  const curried = (...args: unknown[]) => {
    if (fn.length <= args.length) {
      const realArgs = args.slice(0, fn.length);
      const restArgs = args.slice(fn.length);

      args = [
        ...realArgs.map((arg) => {
          if (!restArgs.length) return arg;
          if (arg === curry._) {
            return restArgs.shift();
          }

          return arg;
        }),
        ...restArgs,
      ];
    }

    if (fn.length === args.length && args.every((arg) => arg !== curry._)) {
      return fn(...args);
    }

    return (...restArgs: unknown[]) => curried(...args, ...restArgs);
  };

  return curried;
}

curry._ = "_hole";

const diff = curry((a: number, b: number, c: number) => a - b - c);

console.log(diff(curry._, curry._, 15)(25)(10)); // 0

function compose<T, R>(...fnArray: ((...args: T[]) => R)[]) {
  const fnIter = fnArray[Symbol.iterator]();

  return (arg: T) => {
    const curried = (): any => {
      const { done, value: fn } = fnIter.next();

      if (done) {
        return arg;
      }

      return fn(curried());
    };

    return curried();
  };
}

const f = compose(
  (a: number) => a ** 2,
  (a) => a * 10,
  (a) => Math.sqrt(a) // Первая
);

console.log(f(16)); // 1600
