interface Monada<T> {
  flatMap<R>(fn: (data: T) => Monada<R> | R): Monada<R>;
}

interface Functor<T> {
  map<R>(fn: (data: T) => R): Functor<R>;
}

class Result<T> {
  result!: T;
  status: "ok" | "error" = "ok";
  error?: unknown;

  constructor(cb: () => T) {
    try {
      this.result = cb();
    } catch (error) {
      this.status = "error";
      this.error = error;
    }
  }

  static resolve<T>(value: Result<T> | T) {
    return value instanceof Result ? value : new Result(() => value);
  }

  then(fn: (data: T) => void) {
    if (this.status === "ok") {
      fn(this.result!);
    }

    return this;
  }

  catch(fn: (error: unknown) => void) {
    if (this.status === "error") {
      fn(this.error);
    }

    return this;
  }

  flatMap<R>(fn: (value: T) => Result<R> | R) {
    if (this.status === "ok") {
      return new Result(() => Result.resolve(fn(this.result)).result);
    }

    return this;
  }

  map<R>(fn: (value: T) => R) {
    if (this.status === "ok") {
      return new Result(() => fn(this.result));
    }

    return this;
  }
}

export const res = new Result(() => 42);

console.log(
  res
    .flatMap((value) => {
      throw "Boom";
    })
    .flatMap((value) => value + 1)
    .catch(console.error)
);

console.log(res.flatMap((value) => value + 1).flatMap((value) => value + 1));

const res2 = new Result(() => 42);

res2.map((value) => value * 10).then(console.log); //420

// @ts-ignore
Function.prototype.map = function (fn) {
  // const original = this;
  // return function (x: any) {
  //   return fn(original(x));
  // };
  return (...args: any[]) => fn(this(...args));
};

// @ts-ignore
console.log(((v) => v * 10).map((a) => 42 + a).map((a) => a + 42)(1)); // 420
