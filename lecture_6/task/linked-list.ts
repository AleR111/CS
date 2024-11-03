import { equal, deepEqual } from 'node:assert';

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

{
	const list = new LinkedList<number>();

	list.pushLeft(10);
	equal(list.first?.value, 10);
	equal(list.last?.value, 10);

	list.pushLeft(5);
	equal(list.first?.value, 5);
	equal(list.last?.value, 10);

	list.pushRight(3);
	equal(list.first?.value, 5);
	equal(list.last?.value, 3);

	list.pushRight(13);
	equal(list.first?.value, 5);
	equal(list.last?.value, 13);

	deepEqual([...list.values()], [5, 10, 3, 13]);
	deepEqual([...list.reversedValues()], [13, 3, 10, 5]);

	equal(list.popLeft(), 5);
	equal(list.popRight(), 13);

	equal(list.first?.value, 10);
	equal(list.last?.value, 3);
	deepEqual([...list.values()], [10, 3]);

	equal(list.popLeft(), 10);

	equal(list.first?.value, 3);
	equal(list.first === list.last, true);
	deepEqual([...list.values()], [3]);

	equal(list.popRight(), 3);

	equal(list.first, null);
	equal(list.last, null);
	deepEqual([...list.values()], []);
}
