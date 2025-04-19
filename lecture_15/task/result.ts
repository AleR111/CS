class HeapTree<T> {
  buffer: T[];
  comparator: (a: T, b: T) => number;

  constructor(comparator: (a: T, b: T) => number) {
    this.buffer = [];
    this.comparator = comparator;
  }

  add(value: T) {
    const childIndex = this.buffer.push(value) - 1;

    const compare = (childIndex: number) => {
      const parentIndex = this.getParentIndex(childIndex);
      const parent = this.buffer[parentIndex];
      const child = this.buffer[childIndex];

      if (this.comparator(child, parent) < 0) {
        this.buffer[childIndex] = parent;
        this.buffer[parentIndex] = child;
        compare(parentIndex);
      } else {
        return;
      }
    };

    compare(childIndex);

    return this.buffer.length;
  }

  delete() {
    if (this.buffer.length === 0) return undefined;
    if (this.buffer.length === 1) return this.buffer.pop();

    const head = this.head;
    const lastNode = this.buffer.pop();
    this.buffer[0] = lastNode!;

    const size = this.buffer.length;
    let index = 0;

    while (true) {
      const leftIndex = this.getLeftIndex(index);
      const rightIndex = this.getRightIndex(index);
      let smallestOrLargest = index;

      if (leftIndex < size && this.compare(leftIndex, smallestOrLargest) < 0) {
        smallestOrLargest = leftIndex;
      }
      if (
        rightIndex < size &&
        this.compare(rightIndex, smallestOrLargest) < 0
      ) {
        smallestOrLargest = rightIndex;
      }
      if (smallestOrLargest === index) {
        break;
      }

      this.swap(index, smallestOrLargest);
      index = smallestOrLargest;
    }

    return head;
  }

  private getParentIndex(index: number) {
    return Math.floor((index - 1) / 2);
  }

  private getLeftIndex(index: number) {
    return 2 * index + 1;
  }

  private getRightIndex(index: number) {
    return 2 * index + 2;
  }

  private swap(index1: number, index2: number) {
    [this.buffer[index1], this.buffer[index2]] = [
      this.buffer[index2],
      this.buffer[index1],
    ];
  }

  private compare(index1: number, index2: number) {
    return this.comparator(this.buffer[index1], this.buffer[index2]);
  }

  get head() {
    return this.buffer[0];
  }
}

function heapSort<T>(array: T[], comparator: (a: T, b: T) => number) {
  const heap = new HeapTree(comparator);

  for (const el of array) {
    heap.add(el);
  }

  array = new Array(array.length);

  for (let i = 0; i < array.length; i++) {
    const elem = heap.delete();

    if (elem) {
      array[i] = elem;
    }
  }

  return array;
}

const sortedArray = heapSort([1, 20, 5, 51, 3], (a, b) => a - b);
console.log("🚀 ~ sortedArray:", sortedArray);
