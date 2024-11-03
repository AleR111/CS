interface List {
  value: any;
  prev: List | null;
  next: List | null;
}

class LinkedList {
  list: List = {
    value: null,
    prev: null,
    next: null,
  };
  first: List;
  last: List;
  length = 0;

  constructor() {
    this.first = this.list;
    this.last = this.list;
  }

  add(value: any) {
    if (!this.length) {
      this.length++;
      return (this.first.value = value);
    }

    const newEl: List = { value, next: null, prev: this.last };
    this.last.next = newEl;
    this.last = newEl;

    this.length++;
  }

  [Symbol.iterator]() {
    let current: List | null | undefined = this.first;

    return {
      next: () => {
        if (current) {
          const value = current?.value;
          current = current?.next;
          return { value, done: false };
        } else {
          return { value: null, done: true };
        }
      },
    };
  }
}

const list = new LinkedList();

list.add(1);
list.add(2);
list.add(3);

console.log(list.first.value); // 1
console.log(list.last?.value); // 3
console.log(list.first.next?.value); // 2
console.log(list.first.next?.next?.value); // 3
console.log(list.first.next?.prev?.value); // 1

for (const value of list) {
  console.log(value);
}
