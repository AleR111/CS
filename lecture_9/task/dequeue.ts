import { equal } from 'node:assert';

type QueueTypes =
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

class ListNode<T> {
	value: T;

	prev: ListNode<T> | null = null;
	next: ListNode<T> | null = null;

	constructor(value: T, {prev, next}: {prev?: ListNode<T> | null, next?: ListNode<T> | null}) {
		this.value = value;

		if (prev != null) {
			this.prev = prev;
			prev.next = this;
		}

		if (next != null) {
			this.next = next;
			next.prev = this;
		}
	}
}

class LinkedList<T> {
	first: ListNode<T> | null = null;
	last: ListNode<T> | null = null;

	[Symbol.iterator]() {
		return this.values();
	}

	pushLeft(value: T) {
		const {first} = this;
		this.first = new ListNode(value, {next: first});

		if (this.last == null) {
			this.last = this.first;
		}
	}

	popLeft() {
		const {first} = this;

		if (first == null || first === this.last) {
			this.first = null;
			this.last = null;

		} else {
			this.first = first.next;
			this.first!.prev = null;
		}

		return first?.value;
	}

	pushRight(value: T) {
		const {last} = this;
		this.last = new ListNode(value, {prev: last});

		if (this.first == null) {
			this.first = this.last;
		}
	}

	popRight() {
		const {last} = this;

		if (last == null || last === this.first) {
			this.first = null;
			this.last = null;

		} else {
			this.last = last.prev;
			this.last!.next = null;
		}

		return last?.value;
	}

	*values() {
		let node = this.first;

		while (node != null) {
			yield node.value;
			node = node.next;
		}
	}

	*reversedValues() {
		let node = this.last;

		while (node != null) {
			yield node.value;
			node = node.prev;
		}
	}
}

class Dequeue<T extends QueueTypes> {
	length: number = 0;
	readonly capacity: number;
	readonly TypedArray: TypedArray<T>;

	list: LinkedList<T>;
	firstIndex: number | null = null;
	lastIndex: number | null = null;

	get first(): (T extends BigUint64Array | BigInt64Array ? bigint : number) | undefined {
		if (this.firstIndex == null) {
			return undefined;
		}

		return this.list.first!.value[this.firstIndex] as any;
	}

	get last(): (T extends BigUint64Array | BigInt64Array ? bigint : number) | undefined {
		if (this.lastIndex == null) {
			return undefined;
		}

		return this.list.last!.value[this.lastIndex] as any;
	}

	constructor(TypedArray: TypedArray<T>, capacity: number) {
		if (capacity <= 0 || capacity % 1 != 0) {
			throw new TypeError('The capacity can only be a positive integer');
		}

		this.capacity = capacity;
		this.TypedArray = TypedArray;

		this.list = new LinkedList<T>();
		this.list.pushLeft(new TypedArray(capacity));
	}

	pushLeft(value: T extends BigUint64Array | BigInt64Array ? bigint : number) {
		this.length++;
		let {firstIndex} = this;

		if (firstIndex == null) {
			firstIndex = Math.floor(this.capacity / 2);

		} else {
			firstIndex--;

			if (firstIndex < 0) {
				firstIndex = this.capacity - 1;
				this.list.pushLeft(new this.TypedArray(this.capacity));
			}
		}

		this.firstIndex = firstIndex;
		this.list.first!.value[firstIndex] = value;

		if (this.lastIndex == null) {
			this.lastIndex = this.firstIndex;
		}

		return this.length;
	}

	popLeft(): (T extends BigUint64Array | BigInt64Array ? bigint : number) | undefined {
		let {firstIndex} = this;

		if (firstIndex == null) {
			return undefined;
		}

		this.length--;
		const value = this.list.first!.value[firstIndex];

		// null <- [_, _, _, _, _, _, _]

		if (firstIndex === this.lastIndex && this.list.first === this.list.last) {
			this.firstIndex = null;
			this.lastIndex = null;

		} else {
			firstIndex++;

			if (firstIndex >= this.capacity) {
				firstIndex = 0;
				this.list.popLeft();
			}

			this.firstIndex = firstIndex;

			if (firstIndex > this.lastIndex! && this.list.first === this.list.last) {
				// FIXME ставить в середину
				this.lastIndex = firstIndex;
			}
		}

		return value as any;
	}

	pushRight(value: T extends BigUint64Array | BigInt64Array ? bigint : number) {
		this.length++;
		let {lastIndex} = this;

		if (lastIndex == null) {
			lastIndex = Math.floor(this.capacity / 2);

		} else {
			lastIndex++;

			if (lastIndex >= this.capacity) {
				lastIndex = 0;
				this.list.pushRight(new this.TypedArray(this.capacity));
			}
		}

		this.lastIndex = lastIndex;
		this.list.last!.value[lastIndex] = value;

		if (this.firstIndex == null) {
			this.firstIndex = this.lastIndex;
		}

		return this.length;
	}

	popRight(): (T extends BigUint64Array | BigInt64Array ? bigint : number) | undefined {
		let {lastIndex} = this;

		if (lastIndex == null) {
			return undefined;
		}

		this.length--;
		const value = this.list.last!.value[lastIndex];

		if (lastIndex === this.firstIndex && this.list.first === this.list.last) {
			this.firstIndex = null;
			this.lastIndex = null;

		} else {
			lastIndex--;

			if (lastIndex < 0) {
				lastIndex = this.capacity - 1;
				this.list.popRight();
			}

			this.lastIndex = lastIndex;

			if (lastIndex < this.firstIndex! && this.list.first === this.list.last) {
				this.firstIndex = lastIndex;
			}
		}

		return value as any;
	}
}

{
	const dequeue = new Dequeue(Uint8Array, 64);

	equal(dequeue.pushRight(1), 1);
	equal(dequeue.pushRight(2), 2);
	equal(dequeue.pushRight(3), 3);
	equal(dequeue.pushRight(4), 4);
	equal(dequeue.pushRight(5), 5);
	equal(dequeue.pushRight(6), 6);

	equal(dequeue.pushLeft(6), 7);
	equal(dequeue.pushLeft(7), 8);
	equal(dequeue.pushLeft(8), 9);
	equal(dequeue.pushLeft(9), 10);
	equal(dequeue.pushLeft(10), 11);

	equal(dequeue.popLeft(), 10);
	equal(dequeue.popRight(), 6);
	equal(dequeue.length, 9);

	equal(dequeue.popLeft(), 9);
	equal(dequeue.popRight(), 5);
	equal(dequeue.length, 7);

	equal(dequeue.popLeft(), 8);
	equal(dequeue.popRight(), 4);
	equal(dequeue.length, 5);

	equal(dequeue.popLeft(), 7);
	equal(dequeue.popRight(), 3);
	equal(dequeue.length, 3);

	equal(dequeue.popLeft(), 6);
	equal(dequeue.popRight(), 2);
	equal(dequeue.length, 1);

	equal(dequeue.popLeft(), 1);
	equal(dequeue.popRight(), undefined);
	equal(dequeue.length, 0);
}
