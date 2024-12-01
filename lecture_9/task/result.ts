import { TypedArray, TypedArrayConstructor } from "../../lecture_8/task/result";

class ListItem {
  value: TypedArray;
  prev?: ListItem;
  next?: ListItem;

  constructor(
    value: TypedArray,
    { prev, next }: { prev?: ListItem; next?: ListItem }
  ) {
    this.value = value;

    if (prev) {
      this.prev = prev;
      prev.next = this;
    }

    if (next) {
      this.next = next;
      next.prev = this;
    }
  }
}

class Dequeue {
  BufferClass: TypedArrayConstructor;
  capacity: number;
  length = 0;
  rightIndex = 0;
  leftIndex = -1;
  first?: ListItem;
  last?: ListItem;

  constructor(BufferClass: TypedArrayConstructor, capacity: number) {
    this.BufferClass = BufferClass;
    this.capacity = capacity;
  }

  pushRight(value: number) {
    const index = this.rightIndex;
    if (!index || index >= this.capacity || !this.last) {
      const buffer = new this.BufferClass(this.capacity);
      buffer[0] = value;

      this.last = new ListItem(buffer, { prev: this.last });
      this.rightIndex = 0;
    } else {
      this.last.value[index] = value;
    }

    if (this.first == null) {
      this.first = this.last;
    }

    this.rightIndex++;
    return ++this.length;
  }

  pushLeft(value: number) {
    const index = this.leftIndex;
    if (index < 0 || !this.first) {
      const buffer = new this.BufferClass(this.capacity);
      buffer[this.capacity - 1] = value;

      this.first = new ListItem(buffer, { next: this.first });
      this.leftIndex = this.capacity - 1;
    } else {
      this.first.value[index] = value;
    }

    if (this.last == null) {
      this.last = this.first;
    }

    this.leftIndex--;
    return ++this.length;
  }

  popRight() {
    if (!this.length) {
      return this.reset();
    }

    this.rightIndex--;
    this.length--;

    const value = this.last?.value[this.rightIndex];

    if (this.rightIndex === 0 && this.last) {
      this.rightIndex = this.capacity;
      this.last = this.last?.prev;
      this.last!.next = undefined;
    }

    return value;
  }

  popLeft() {
    if (!this.length) {
      return this.reset();
    }

    this.leftIndex++;
    this.length--;

    const value = this.first?.value[this.leftIndex];

    if (this.leftIndex === this.capacity - 1 && this.first?.next) {
      this.leftIndex = -1;
      this.first = this.first?.next;
      this.first!.prev = undefined;
    }

    return value;
  }

  private reset() {
    this.first = undefined;
    this.last = undefined;
    this.rightIndex = 0;
    this.leftIndex = -1;
  }
}

const dequeue = new Dequeue(Uint8Array, 64);

console.log(dequeue.pushLeft(1)); // Возвращает длину - 1
console.log(dequeue.pushLeft(2)); // 2
console.log(dequeue.pushLeft(3)); // 3

console.log(dequeue.length); // 3


dequeue.pushLeft(1); // 4
dequeue.pushLeft(2); // 4
dequeue.pushLeft(3); // 4
dequeue.pushLeft(4); // 4
dequeue.pushLeft(5); // 4


console.log("🚀 ~", dequeue.popLeft());
console.log("🚀 ~", dequeue.popLeft());
console.log("🚀 ~", dequeue.popLeft());
console.log("🚀 ~", dequeue.popLeft());
console.log("🚀 ~", dequeue.popLeft());
console.log(dequeue.pushRight(5))
console.log(dequeue.popRight())

dequeue.pushLeft(1); // 4
dequeue.pushLeft(2); // 4
dequeue.pushLeft(3); // 4
dequeue.pushLeft(4); // 4
dequeue.pushLeft(5); // 4


console.log("🚀 ~", dequeue.popLeft());
console.log("🚀 ~", dequeue.popLeft());
console.log("🚀 ~", dequeue.popLeft());
console.log("🚀 ~", dequeue.popLeft());
console.log("🚀 ~", dequeue.popLeft());

