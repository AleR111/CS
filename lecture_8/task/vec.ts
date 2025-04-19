import { equal, deepEqual } from 'node:assert';

type VectorTypes =
	Uint8Array |
	Uint8ClampedArray |
	Int8Array |
	Uint16Array |
	Int16Array |
	Uint32Array |
	Int32Array |
	Float32Array |
	Float64Array |
	BigUint64Array |
	BigInt64Array;

interface VectorOptions {
	capacity?: number;
}

type TypedArray<T> = new (capacity: number) => T;

class Vector<T extends VectorTypes> {
	length: number = 0;
	capacity: number;

	array: T;
	readonly TypedArray: TypedArray<T>;

	get buffer() {
		return this.array.buffer;
	}

	constructor(TypedArray: TypedArray<T>, {capacity = 1}: VectorOptions = {}) {
		if (capacity <= 0 || capacity % 1 != 0) {
			throw new TypeError('The vector capacity can only be a positive integer');
		}

		this.capacity = capacity;
		this.TypedArray = TypedArray;
		this.array = new TypedArray(capacity);
	}

	push(...values: Array<T extends BigUint64Array | BigInt64Array ? bigint : number>): number {
		if (this.length + values.length >= this.capacity) {
			let newCapacity = this.capacity;

			do {
				newCapacity *= 2;

			} while (newCapacity <= this.capacity + values.length);

			this.#changeBuffer(newCapacity);
		}

		for (const value of values) {
			this.array[this.length] = value;
			this.length++;
		}

		return this.length;
	}

	pop(): (T extends BigUint64Array | BigInt64Array ? bigint : number) | undefined {
		if (this.length === 0) {
			return undefined;
		}

		this.length--;
		return this.array[this.length] as any;
	}

	shrinkToFit(): number {
		this.#changeBuffer(this.length);
		return this.capacity;
	}

	*values(): IterableIterator<T extends BigUint64Array | BigInt64Array ? bigint : number> {
		for (let i = 0; i < this.length; i++) {
			yield this.array[i] as any;
		}
	}

	#changeBuffer(newCapacity: number = this.capacity * 2) {
		const newArray = new this.TypedArray(newCapacity);

		for (const [i, value] of this.array.entries()) {
			newArray[i] = value;
		}

		this.capacity = newCapacity;
		this.array = newArray;
	}
}

{
	const vec = new Vector(Int16Array, {capacity: 4});

	equal(vec.length, 0);
	equal(vec.capacity, 4);

	equal(vec.push(1, 2, 3), 3);
	equal(vec.length, 3);
	equal(vec.capacity, 4);

	equal(vec.push(4, 5, 6), 6);
	equal(vec.length, 6);
	equal(vec.capacity, 8);

	equal(vec.pop(), 6);
	equal(vec.pop(), 5);
	equal(vec.pop(), 4);

	equal(vec.capacity, 8);
	equal(vec.shrinkToFit(), 3);
}

{
	const vec = new Vector(Int32Array, {capacity: 1});

	const i = vec.values();

	vec.push(1);
	vec.push(2);
	vec.push(3);

	deepEqual(i.next(), {done: false, value: 1});
	deepEqual(i.next(), {done: false, value: 2});
	deepEqual(i.next(), {done: false, value: 3});
	deepEqual(i.next(), {done: true, value: undefined});
}
