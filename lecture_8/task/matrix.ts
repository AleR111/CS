import { equal, deepEqual } from 'node:assert';

export type MatrixTypes =
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

type TypedArray<T> = new (capacity: number) => T;

export class Matrix<T extends MatrixTypes> {
	readonly dimension: number[];
	mapping: number[];

	array: T;
	readonly TypedArray: TypedArray<T>;

	get buffer() {
		return this.array.buffer;
	}

	constructor(TypedArray: TypedArray<T>, ...dimension: number[]) {
		if (!dimension.every((value) => value > 1 || value % 1 === 0)) {
			throw new TypeError('Dimension values can only be positive integers');
		}

		this.dimension = dimension;

		this.mapping = dimension.map((_, i) => {
			return i === 0 ? 1 : dimension.slice(0, i).reduce((a, b) => a * b, 1);
		});

		this.TypedArray = TypedArray;
		this.array = new TypedArray(dimension.reduce((r, v) => r * v, 1));
	}

	changeMapping(fn: (mapping: this['mapping']) => this['mapping']) {
		this.mapping = fn(this.mapping);
	}

	get(...coords: number[]): T extends BigUint64Array | BigInt64Array ? bigint : number {
		const idx = this.#getIndex(coords);
		return this.array[idx] as any;
	}

	set(...args: [...number[], T extends BigUint64Array | BigInt64Array ? bigint : number]) {
		const idx = this.#getIndex(args.slice(0, -1) as number[]);
		this.array[idx] = args.at(-1) as any;
	}

	*values(): IterableIterator<T extends BigUint64Array | BigInt64Array ? bigint : number> {
		for (const value of this.array) {
			yield value as any;
		}
	}

	#getIndex(coords: number[]): number {
		if (coords.length !== this.dimension.length) {
			throw new TypeError('The passed coordinates do not match the matrix dimension');
		}

		return coords.reduce((res, value, i) => res + value * this.mapping[i], 0);
	}
}

{
	const matrix = new Matrix(Int32Array, 2, 2, 2);

	matrix.changeMapping(([x, y, z]) => {
		return [z, x, y]
	});

	matrix.set(0, 0, 0, 1);
	matrix.set(0, 1, 0, 2);
	matrix.set(0, 0, 1, 3);
	matrix.set(0, 1, 1, 4);

	matrix.set(1, 0, 0, 5);
	matrix.set(1, 1, 0, 6);
	matrix.set(1, 0, 1, 7);
	matrix.set(1, 1, 1, 8);

	equal(matrix.get(0, 0, 0), 1); // 1
	equal(matrix.get(0, 1, 0), 2); // 2
	equal(matrix.get(0, 0, 1), 3); // 3
	equal(matrix.get(0, 1, 1), 4); // 4

	equal(matrix.get(1, 0, 0), 5); // 5
	equal(matrix.get(1, 1, 0), 6); // 6
	equal(matrix.get(1, 0, 1), 7); // 7
	equal(matrix.get(1, 1, 1), 8); // 8

	deepEqual(Array.from(matrix.values()), [1, 2, 3, 4, 5, 6, 7, 8]);
}
