export class Result<T> {
  result?: T;
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
}

const res1 = new Result(() => 42);

res1.then((data) => {
  console.log(data);
});

const res2 = new Result(() => {
  throw "Boom!";
});

res2
  .then((data) => {
    // Этот callback не вызовется
    console.log(data);

    // А этот вызовется
  })
  .catch(console.error);

function exec(gen: () => Generator<Result<any>>) {
  const iterator = gen();
  let data = null;

  while (true) {
    const { value, done } = iterator.next(data);

    if (done) {
      break;
    }

    value
      .then((res) => {
        data = res;
      })
      .catch((err) => {
        iterator.throw(err);
      });
  }
}

exec(function* main() {
  const res1 = new Result(() => 42);
  console.log(yield res1);

  try {
    const res2 = yield new Result(() => {
      throw "Boom!!!";
    });
  } catch (err) {
    console.error('sdc');
  }

  const res2 = new Result(() => 43);
  console.log(yield res2);

  console.log('end');
});

