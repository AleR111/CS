interface VectorOptions {
  capacity: number;
}

type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;

type TypedArrayConstructor =
  | Int8ArrayConstructor
  | Uint8ArrayConstructor
  | Uint8ClampedArrayConstructor
  | Int16ArrayConstructor
  | Uint16ArrayConstructor
  | Int32ArrayConstructor
  | Uint32ArrayConstructor
  | Float32ArrayConstructor
  | Float64ArrayConstructor;

class Vector {
  BufferClass: TypedArrayConstructor;
  buffer: TypedArray;
  capacity: number;
  length: number = 0;

  constructor(BufferClass: TypedArrayConstructor, { capacity }: VectorOptions) {
    this.buffer = new BufferClass(capacity);
    this.capacity = capacity;
    this.BufferClass = BufferClass;
  }

  push(value: number) {
    if (this.length === this.capacity) {
      this.reallocate();
    }
    this.buffer[this.length] = value;
    return ++this.length;
  }

  pop() {
    const elem = this.buffer[this.length - 1];
    this.length -= 1;

    return elem;
  }

  shrinkToFit() {
    this.reallocate(this.length);
  }

  values() {
    let index = 0;

    const next = () => {
      if (index === this.length) {
        return { done: true, value: undefined };
      }

      return { done: false, value: this.buffer[index++] };
    };

    return {
      next,
    };
  }

  private reallocate(capacity: number = this.capacity * 2) {
    this.capacity = capacity;
    const oldBuffer = this.buffer;
    this.buffer = new this.BufferClass(capacity);
    this.buffer.set(oldBuffer.subarray(0, capacity));
  }
}

const vec = new Vector(Int32Array, { capacity: 4 });

vec.push(1); // Возвращает длину - 1
vec.push(2); // 2
vec.push(3); // 3
console.log(vec.push(4)); // 4
vec.push(5); // 5 Увеличение буфера

console.log(vec.buffer);

console.log(vec.capacity); // 8
console.log(vec.length); // 5

console.log(vec.pop()); // Удаляет с конца, возвращает удаленный элемент - 5
console.log(vec.capacity); // 8

vec.shrinkToFit(); // Новая емкость 4
console.log(vec.capacity); // 4

console.log(vec.buffer); // Ссылка на ArrayBuffer

const vec2 = new Vector(Int32Array, { capacity: 1 });

const i = vec2.values();

vec2.push(1);
vec2.push(2);
vec2.push(3);

console.log(vec2.buffer);
console.log(i.next()); // {done: false, value: 1}
console.log(i.next()); // {done: false, value: 2}
console.log(i.next()); // {done: false, value: 3}
console.log(i.next()); // {done: true, value: undefined}

//////////////////////////////////////////////////////////

class Matrix {
  buffer: TypedArray;
  dimensions: number[];

  constructor(BufferClass: TypedArrayConstructor, ...dimensions: number[]) {
    const fullSize = dimensions.reduce((sum, dim) => sum * dim);
    this.buffer = new BufferClass(fullSize);
    this.dimensions = dimensions;
  }

  set(...args: number[]) {
    const value = args.pop();
    const index = this.getFlatIndex(args);
    this.buffer[index] = value!;
  }

  get(...positions: number[]) {
    const index = this.getFlatIndex(positions);
    return this.buffer[index];
  }

  values() {}

  private getFlatIndex(positions: number[]) {
    if (positions.length !== this.dimensions.length) {
      throw new Error(
        "The number of positions must match the matrix dimension"
      );
    }

    let flatIndex = 0;
    let stride = 1;

    for (let i = this.dimensions.length - 1; i >= 0; i--) {
      flatIndex += positions[i] * stride;
      stride *= this.dimensions[i];
    }

    return flatIndex;
  }
}

const matrix2n2n2 = new Matrix(Int32Array, 2, 2, 2);

matrix2n2n2.set(0, 0, 0, 1);
matrix2n2n2.set(0, 1, 0, 2);
matrix2n2n2.set(0, 0, 1, 3);
matrix2n2n2.set(0, 1, 1, 4);

matrix2n2n2.set(1, 0, 0, 5);
matrix2n2n2.set(1, 1, 0, 6);
matrix2n2n2.set(1, 0, 1, 7);
matrix2n2n2.set(1, 1, 1, 8);

console.log(matrix2n2n2.get(0, 0, 0)); // 1
console.log(matrix2n2n2.get(0, 1, 0)); // 2
console.log(matrix2n2n2.get(0, 0, 1)); // 3
console.log(matrix2n2n2.get(0, 1, 1)); // 4

console.log(matrix2n2n2.get(1, 0, 0)); // 5
console.log(matrix2n2n2.get(1, 1, 0)); // 6
console.log(matrix2n2n2.get(1, 0, 1)); // 7
console.log(matrix2n2n2.get(1, 1, 1)); // 8

console.log(matrix2n2n2.buffer); // Ссылка на ArrayBuffer

// [1, 2, 3, 4, 5, 6, 7, 8, 9]
// console.log(Array.from(matrix2n2n2.values()));
