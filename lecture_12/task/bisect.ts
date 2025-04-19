import { equal } from 'node:assert';

function indexOf<T>(arr: T[], comparator: (el: T) => number) {
	let
		from = 0,
		to = arr.length - 1;

	let
		res = -1;

	while (from <= to) {
		const
			mid = from + Math.floor((to - from) / 2),
			comp = comparator(arr[mid]);

		if (comp >= 0) {
			to = mid - 1;

			if (comp === 0) {
				res = mid;
			}

		} else {
			from = mid + 1;
		}
	}

	return res;
}

function lastIndexOf<T>(arr: T[], comparator: (el: T) => number) {
	let
		from = 0,
		to = arr.length - 1;

	let
		res = - 1;

	while (from <= to) {
		if (res !== -1 && (res <= from || res >= to)) {
			return res;
		}

		const
			mid = from + Math.floor((to - from) / 2),
			comp = comparator(arr[mid]);

		if (comp <= 0) {
			from = mid + 1;

			if (comp === 0) {
				res = mid;
			}

		} else {
			to = mid - 1;
		}
	}

	return res;
}

{
	equal(indexOf([1, 2, 3, 4, 4, 4, 5, 6, 7, 8, 9, 10], (el) => el - 4), 3);
	equal(lastIndexOf([1, 2, 3, 4, 4, 4, 5, 6, 7, 8, 9, 10], (el) => el - 4), 5);
}
