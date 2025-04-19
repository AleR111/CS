import { JSDOM } from "jsdom";

// function getNumbers(str: string): IterableIterator<number> {
//   const regExp = /-?\d+\.\d+/g;

//   //   while (true) {
//   //     const value = regExp.exec(str);

//   //     if (!value) {
//   //       return;
//   //       throw "End";
//   //       console.log("🚀 ~ function*getNumbers ~ throw:");
//   //     }

//   //     yield Number(value);
//   //   }

//   return {
//     [Symbol.iterator]() {
//       return this;
//     },
//     next(newStr: string) {
//       if (newStr) {
//         str = newStr;
//       }
//       const value = regExp.exec(str);
//       if (!value) {
//         throw "End";
//       }
//       return { value: Number(value), done: false };
//     },
//   };
// }

// const numbers = getNumbers("number 1.12 and 23 and 32.12 and -73.17");

// try {
//   console.log(...numbers);
// } catch (e) {
//   // Expect new input
//   console.log(e);
//   console.log(numbers.next("number 23 and -73.17"));
// }

const html = `
  <div id="old-parent">
    <div id="parent">
      <p id="child1">Первый</p>
      <p id="child2">Второй</p>
      <p id="child3">Третий</p>
    </div>
  </div>
`;

const dom = new JSDOM(html);
const document = dom.window.document;

function siblings(child: HTMLElement | null) {
  const children = child?.parentNode?.children[Symbol.iterator]();

  return {
    [Symbol.iterator]() {
      return this;
    },
    next() {
      const nexValue = children?.next();
      if (!nexValue || nexValue.done) {
        return { value: undefined, done: true };
      }
      return nexValue;
    },
  };
}
const child1 = document.getElementById("child1");
console.log(...siblings(child1));

function* ancestors(child: HTMLElement | null) {
  while (true) {
    const parent = child?.parentNode as HTMLElement | null;

    if (!parent) return;

    yield parent;
    child = parent;
  }
}

console.log([...ancestors(child1)]);

function* descendants(node: Element | null): Generator<Element, void, unknown> {
  if (!node) return;

  yield node;

  for (const child of node.children) {
    yield* descendants(child as Element);
  }
}


console.log(...descendants(document.getElementById("old-parent")));
