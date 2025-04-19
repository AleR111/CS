import { deepEqual, notDeepEqual } from 'node:assert';

interface MemoryOptions {
	stack?: number;
}

type Data =
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

interface ViewConstructor<T extends Data> {
	BYTES_PER_ELEMENT: number;
	new (buffer: ArrayBuffer, bytesOffset: number, length: number): T;
}

interface PointerOptions<T extends Data> {
	length: number;
	alignment: number;
	memory: Uint8Array;
	View: ViewConstructor<T>;
}

class Pointer<T extends Data> {
	readonly index: number;
	readonly length: number;
	readonly alignment: number;

	readonly memory: Uint8Array;
	readonly View: ViewConstructor<T>;

	constructor(index: number, {memory, length, alignment, View}: PointerOptions<T>) {
		this.index = index;
		this.length = length;
		this.alignment = alignment;
		this.memory = memory;
		this.View = View;
	}

	deref(): T {
		const {View} = this;
		return new View(this.memory.buffer, this.memory.byteOffset + this.index, this.length);
	}

	change(data: T): void {
		const view = this.deref();

		if (view.length < data.length) {
			throw new Error('The size of the data is too large');
		}

		view.set(<any>data);

		if (view.length > data.length) {
			const end = this.index + view.length * view.BYTES_PER_ELEMENT;
			this.memory.fill(0, end - (view.length - data.length) * view.BYTES_PER_ELEMENT, end);
		}
	}
}

interface FreeBlock {
	offset: number;
	size: number
}

class Memory {
	protected buffer: ArrayBuffer;

	protected heap: Uint8Array;
	protected stack: Uint8Array;

	protected SP: number = -1;
	protected BP: number = 0;

	freeBlocks: FreeBlock[];

	constructor(size: number, {stack}: MemoryOptions = {}) {
		size >>>= 0;

		this.buffer = new ArrayBuffer(size);

		stack ??= Math.floor(size * 0.3);

		if (stack > size * 0.5) {
			throw new Error('Stack size too large');
		}

		this.stack = new Uint8Array(this.buffer, 0, stack);

		this.heap = new Uint8Array(this.buffer, stack);
		this.freeBlocks = [{offset: 0, size: this.heap.length}];
	}

	push<T extends Data>(data: T): Pointer<T> {
		const bytesLength = data.length * data.BYTES_PER_ELEMENT;

		if (this.SP + bytesLength >= this.stack.length) {
			throw new Error('Stack overflow');
		}

		const bytes = new Uint8Array(data.buffer, data.byteOffset, bytesLength);

		this.SP++;

		const alignment = this.findNextDivisible(this.SP, data.BYTES_PER_ELEMENT) - this.SP;
		this.SP += alignment;

		this.stack.set(bytes, this.SP);

		const pt = new Pointer<T>(this.SP, {
			memory: this.stack,
			length: data.length,
			alignment,
			View: <any>data.constructor
		});

		this.SP += bytes.length - 1;
		return pt;
	}

	pop(pt: Pointer<any>): void {
		const {BYTES_PER_ELEMENT} = pt.View;
		this.SP -= pt.length * BYTES_PER_ELEMENT + pt.alignment;

		if (this.SP < -1) {
			this.SP = -1;
		}
	}

	alloc<T extends Data>(length: number, DataType: ViewConstructor<T>): Pointer<T> {
		const size = length * DataType.BYTES_PER_ELEMENT;

		for (const [i, block] of this.freeBlocks.entries()) {
			const
				alignment = this.findNextDivisible(block.offset, DataType.BYTES_PER_ELEMENT) - block.offset,
				alignedSize = size + alignment;

			if (block.size >= alignedSize) {
				const pt = new Pointer(block.offset + alignment, {
					memory: this.heap,
					length,
					alignment,
					View: DataType
				});

				block.offset += alignedSize;
				block.size -= alignedSize;

				if (block.size === 0) {
					this.freeBlocks.splice(i, 1);
				}

				return pt;
			}
		}

		throw new Error('Not enough memory available');
	}

	free(pt: Pointer<any>): void {
		this.freeBlocks.push({offset: pt.index - pt.alignment, size: pt.length * pt.View.BYTES_PER_ELEMENT + pt.alignment});
		this.freeBlocks.sort((a, b) => a.offset - b.offset);
		this.mergeFreeBlocks();
	}

	protected mergeFreeBlocks() {
		for (let i = 0; i < this.freeBlocks.length - 1; i++) {
			const
				current = this.freeBlocks[i],
				next = this.freeBlocks[i + 1];

			if (current.offset + current.size === next.offset) {
				current.size += next.size;
				this.freeBlocks.splice(i + 1, 1);
				i--;
			}
		}
	}

	protected findNextDivisible(n: number, k: number): number {
		let remainder = n % k;

		if (remainder === 0) {
			return n;
		}

		return n + (k - remainder);
	}
}

const memory = new Memory(1024, {stack: 256});

const pointer1 = memory.push(new Int16Array([-2, 145, 42, 0, -15]));
const pointer2 = memory.push(new Int32Array([-456, 1234]));
const pointer3 = memory.push(new BigInt64Array([10n, -100n]));

deepEqual(pointer1.deref(), new Int16Array([-2, 145, 42, 0, -15]));
deepEqual(pointer2.deref(), new Int32Array([-456, 1234]));
deepEqual(pointer3.deref(), new BigInt64Array([10n, -100n]));

pointer2.change(new Int32Array([-7]));
deepEqual(pointer2.deref(), new Int32Array([-7, 0]));

memory.pop(pointer3);
memory.pop(pointer2);

const pointer4 = memory.push(new Float64Array([100.23, -4532, 1234]));

deepEqual(pointer1.deref(), new Int16Array([-2, 145, 42, 0, -15]));
deepEqual(pointer4.deref(), new Float64Array([100.23, -4532, 1234]));

// UB!!!
notDeepEqual(pointer3.deref(), new BigInt64Array([10n, -100n]));

const block1 = memory.alloc(2, Int16Array);
block1.change(new Int16Array([-18, 463]));
deepEqual(block1.deref(), new Int16Array([-18, 463]));
console.log("🚀 ~ memory:", memory.freeBlocks)


const block2 = memory.alloc(4, Float64Array);
block2.change(new Float64Array([-18, 463, 2.23]));
deepEqual(block2.deref(), new Float64Array([-18, 463, 2.23, 0]));
console.log("🚀 ~ memory:", memory.freeBlocks)


memory.free(block1);
console.log("🚀 ~ memory:", memory.freeBlocks)

memory.free(block2);
console.log("🚀 ~ memory:", memory.freeBlocks)


const block3 = memory.alloc(2, BigInt64Array);
console.log("🚀 ~ memory:", memory.freeBlocks)
block3.change(new BigInt64Array([1n, -3n]));
deepEqual(block3.deref(), new BigInt64Array([1n, -3n]));

// UB!!!
notDeepEqual(block1.deref(), new Int16Array([-18, 463]));
