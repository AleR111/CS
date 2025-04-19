interface Comparator<T> {
	(a: T, b: T): number;
}

class BinaryHeap<T> {
	readonly buffer: (T | undefined)[];
	readonly comparator: Comparator<T>;

	protected lastIndex: number;

	constructor(comparator: Comparator<T>, buffer: T[] = []) {
		this.comparator = comparator;
		this.buffer = buffer;
		this.lastIndex = this.buffer.length - 1;
	}

	get head(): T | undefined {
		return this.buffer[0];
	}

	get size(): number {
		return this.lastIndex + 1;
	}

	[Symbol.iterator](): IterableIterator<T> {
		return {
			[Symbol.iterator]() {
				return this;
			},

			next: () => {
				const done = this.lastIndex === -1;

				return {
					done,
					value: this.pop()!
				}
			}
		};
	}

	push(value: T): number {
		this.lastIndex++;
		this.buffer[this.lastIndex] = value;

		if (this.lastIndex !== 1) {
			this.fromBottom();
		}

		return this.size;
	}

	pop(): T | undefined {
		const {head} = this;

		if (this.lastIndex > 0) {
			this.buffer[0] = this.buffer[this.lastIndex];

			this.buffer[this.lastIndex] = undefined;
			this.lastIndex--;

			this.toBottom();

		} else {
			this.buffer[0] = undefined;
			this.lastIndex = -1;
		}

		return head;
	}

	toBottom(i: number = 0): void {
		const
			value = this.buffer[i];

		let
			cursor = i;

		while (cursor < this.lastIndex / 2) {
			let
				childIndex;

			let
				leftIndex = this.getLeftIndex(cursor),
				rightIndex = this.getRightIndex(cursor);

			const
				left = this.buffer[leftIndex],
				right = this.buffer[rightIndex];

			if (right == null) {
				childIndex = leftIndex;

			} else {
				childIndex = this.comparator(left!, right) < 0 ? leftIndex : rightIndex;
			}

			const
				child = this.buffer[childIndex]!;

			if (this.comparator(value!, child) <= 0) {
				break;
			}

			this.buffer[cursor] = child;
			cursor = childIndex;
		}

		this.buffer[cursor] = value;
	}

	fromBottom(i: number = this.lastIndex): void {
		const
			value = this.buffer[i];

		let
			cursor = i;

		while (cursor > 0) {
			const
				parentIndex = this.getParentIndex(cursor),
				parent = this.buffer[parentIndex]!;

			if (this.comparator(value!, parent) >= 0) {
				break;
			}

			this.buffer[cursor] = parent;
			cursor = parentIndex;
		}

		this.buffer[cursor] = value;
	}

	protected getParentIndex(current: number): number {
		return Math.floor((current - 1) / 2);
	}

	protected getLeftIndex(current: number): number {
		return current * 2 + 1;
	}

	protected getRightIndex(current: number): number {
		return current * 2 + 2;
	}
}

function heapSort2<T>(arr: T[], comparator: Comparator<T>): T[] {
	// const heap = new BinaryHeap<T>(comparator, []);
	//
	// for (let i = 0; i < arr.length; i++) {
	// 	heap.push(arr[i]);
	// }
	//
	// return [...heap];

	const heap = new BinaryHeap<T>((a, b) => comparator(a, b) * -1, arr);

	// push (всплываем)
	// pop (извлекаем вершину, на её место последний элемент, и погружаемся)

	// полное дерево

	//     3
	//  3     2
	// 2  1  0  1

	for (let i = Math.floor(heap.size / 2) - 1; i >= 0; i--) {
		heap.toBottom(i);
	}

	for (let i = 0; i < arr.length; i++) {
		arr[arr.length - i - 1] = heap.pop()!;
	}

	return arr;
}

console.log(heapSort2([1, 2, 5, 3, 4, 7, 9, 6], (a, b) => a - b))
