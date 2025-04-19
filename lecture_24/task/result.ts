interface ParserToken<T = unknown> {
  type: string;
  value?: T;
}

interface ParserValue<T = unknown> extends ParserToken<T> {}

type ParserResult<T = unknown> = [ParserValue, Iterable<string>];

type Parser<T = unknown, R = unknown> = (
  iterable: Iterable<string>,
  prev?: ParserValue
) => Generator<ParserToken<T>, ParserResult<R>>;

type Template = string | RegExp;

function returnIterableIterator<T>(iterable: Iterable<T>): IterableIterator<T> {
  const iter = iterable[Symbol.iterator]();

  if (Symbol.iterator in iter) {
    return iter as IterableIterator<T>;
  }

  return {
    [Symbol.iterator]() {
      return this;
    },
    next() {
      return iter.next();
    },
  };
}

function checkTemplate(test: Template, value: string) {
  switch (typeof test) {
    case "string":
      if (test === value) {
        return true;
      }
      break;
    default:
      if (test.test(value)) {
        return true;
      }
  }

  throw new Error("Parsing failed: no valid tokens found.");
}

function tag(template: Iterable<Template>): Parser<string, string> {
  return function* (source) {
    const strIter = returnIterableIterator(source);

    let value = "";

    for (const pattern of template) {
      const valueStr = strIter.next();

      if (valueStr.done) {
        throw new Error("Parsing failed: no valid tokens found.");
      }

      checkTemplate(pattern, valueStr.value);
      value += valueStr.value;
    }

    const token = {
      type: "TAG",
      value,
    };

    return [token, strIter];
  };
}

const fnTag = tag("function")("function foo() {}");

// console.log(fnTag.next()); // {done: true, value: {type: 'TAG', value: 'function'}}

interface TakeParams {
  min?: number;
  max?: number;
}

function take(
  template: Iterable<Template>,
  params: TakeParams = {}
): Parser<string, string> {
  return function* (source) {
    const { min = 1, max = Infinity } = params;

    const strIter = returnIterableIterator(source);

    let value = "";
    let count = 0;

    main: while (true) {
      if (count >= max) {
        break;
      }

      for (const pattern of template) {
        const valueStr = strIter.next();

        if (valueStr.done) {
          if (count >= min) {
            break main;
          }
          throw new Error("Parsing failed: no valid tokens found.");
        }

        try {
          checkTemplate(pattern, valueStr.value);
          value += valueStr.value;
        } catch (err) {
          if (count < min) {
            throw err;
          }
          break main;
        }
      }

      count++;
    }

    const token = {
      type: "TAKE",
      value,
    };

    return [token, strIter];
  };
}

const takeNumber = take([/\d/])("1234 foo");

// console.log(takeNumber.next()); // {done: true, value: {type: 'TAKE', value: '1234'}}

const takeNumber2 = take([/\d/], { max: 2 })("1234 foo");

// console.log(takeNumber2.next()); // {done: true, value: {type: 'TAKE', value: '12'}}

function seq(...iters: Parser<string, string>[]): Parser<string, string> {
  return function* (source) {
    let strIter = returnIterableIterator(source);

    let value = "";
    for (const iter of iters) {
      const qwe = iter(strIter);
      const { value: iterVal } = qwe.next() as any;
      // strIter = iterVal[1];
      value += iterVal[0].value;
    }

    const token = {
      type: "SEQ",
      value,
    };

    return [token, strIter];
  };
}

const fnExpr = seq(
  tag("function "),

  take([/[a-z_$]/i], { max: 1 }),
  take([/\w/], { min: 0, max: 2 }),

  tag("()")
)("function foo() {}");

console.log(fnExpr.next()); // {done: true, value: {type: 'SEQ', value: 'function foo()'}}

function or(...iters: Parser<string, string>[]): Parser<string, string> {
  return function* (source) {
    let strIter = returnIterableIterator(source);
    let value = "";

    for (const iter of iters) {
      const qwe = iter(source);
      try {
        const { value: iterVal } = qwe.next() as any;
        strIter = iterVal[1];
        value = iterVal[0].value;
      } catch {
        continue;
      }
    }

    const token = {
      type: "OR",
      value,
    };

    return [token, strIter];
  };
}

const boolExpr = or(tag("true"), tag("false"))("false");

console.log(boolExpr.next()); // {done: true, value: {type: 'TAG', value: 'false'}}

interface RepeatParams {
  min?: number;
  max?: number;
}

function repeat(
  iter: Parser<string, string>,
  params: RepeatParams = {}
): Parser<string, string> {
  return function* (source) {
    const strIter = returnIterableIterator(source);
    const { min = 1, max = Infinity } = params;

    let value = "";
    let count = 0;

    while (true) {
      if (count >= max) {
        break;
      }
      try {
        const qwe = iter(strIter);

        const { value: iterVal } = qwe.next() as any;
        yield iterVal[0];
        count++;
      } catch (error) {
        break;
      }
    }

    const token = {
      type: "REPEAT",
      value,
    };

    return [token, strIter];
  };
}

const takeNumbers = repeat(seq(take([/\d/], { max: 3 }), tag(",")), { min: 1 })(
  "100,200,300,"
);

console.log(takeNumbers.next()); // {done: false, value: {type: 'SEQ', value: '100,'}}
console.log(takeNumbers.next()); // {done: false, value: {type: 'SEQ', value: '200,'}}
console.log(takeNumbers.next()); // {done: false, value: {type: 'SEQ', value: '300,'}}

function opt(iter: Parser<string, string>): Parser<string, string> {
  return repeat(iter, { min: 0, max: 1 });
}

const takeNumbers2 = repeat(seq(take([/\d/], { max: 3 }), opt(tag(","))), { min: 1 })(
  "100,200,300"
);

console.log(takeNumbers2.next()); // {done: false, value: {type: 'SEQ', value: '100,'}}
console.log(takeNumbers2.next()); // {done: false, value: {type: 'SEQ', value: '200,'}}
console.log(takeNumbers2.next()); // {done: false, value: {type: 'SEQ', value: '300'}}
