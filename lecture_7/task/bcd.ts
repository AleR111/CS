import { equal, deepEqual } from 'node:assert';

type BCDInput = bigint | number | number[] | string | ArrayBuffer | Uint8Array | BCD;

class BCD {
	static readonly BCD_SIZE = 4;
	static readonly BCD_PER_NUMBER = 2;

	static readonly PLUS = 0b1100;
	static readonly MINUS = 0b1101;
	static readonly MASK = 0b1111;

	static readonly SIGN_INDEX = this.BCD_PER_NUMBER - 1;

	static readonly BCD8421 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
	static readonly COMPLEMENT9S = this.BCD8421.slice().reverse();

	static resolve(input: BCDInput): BCD {
		return input instanceof BCD ? input : new BCD(input);
	}

	readonly store: Uint8Array;

	readonly fixedPoint: number = 0;

	get isNegative(): boolean {
		return (this.store.at(-1)! >>> this.getShift(BCD.SIGN_INDEX) & BCD.MASK) === BCD.MINUS;
	}

	get freeSlots(): number {
		return (this.store.at(-1)! & BCD.MASK) === BCD.MASK ? 1 : 0;
	}

	get length(): number {
		return this.store.length * BCD.BCD_PER_NUMBER - this.freeSlots - 1;
	}

	get buffer(): ArrayBuffer {
		return this.store.buffer;
	}

	get integer(): BCD {
		const integer: number[] = [];

		for (const [i, num] of this.entries()) {
			if (i >= this.fixedPoint) {
				integer.push(num);
			}
		}

		integer.push(BCD.PLUS);
		return new BCD(integer);
	}

	get fractional(): BCD {
		const fractional: number[] = [];

		for (const [i, num] of this.entries()) {
			if (i < this.fixedPoint) {
				fractional.push(num);
				continue;
			}

			break;
		}

		fractional.push(BCD.PLUS);
		return new BCD(fractional);
	}

	constructor(input: BCDInput, fixedPoint?: number) {
		const that = this;

		if (fixedPoint != null) {
			this.fixedPoint = fixedPoint;
		}

		if (input instanceof ArrayBuffer) {
			this.store = new Uint8Array(input);
			return;
		}

		if (input instanceof BCD) {
			// FIXME копировать
			this.store = new Uint8Array(input.buffer);

			if (fixedPoint == null) {
				this.fixedPoint = input.fixedPoint;
			}

			return;
		}

		if (typeof input === 'number') {
			const fractional = String(input).split('.')[1] ?? '';

			if (fixedPoint == null) {
				this.fixedPoint = fractional.length;
			}

			input *= 10 ** fractional.length;
		}

		// FIXME использовать вектор над Uint8Array
		const buffer = [0];

		let
			isNegative = false,
			nibble = 0;

		if (Array.isArray(input) || input instanceof Uint8Array) {
			isNegative = input.at(-1) === BCD.MINUS;

			for (let i = 0; i < input.length - 1; i++) {
				addDigit(input[i], false);
			}

		} else if (typeof input === 'string') {
			isNegative = input.startsWith('-');

			if (fixedPoint == null) {
				const fractional = input.split('.')[1] ?? '';
				this.fixedPoint = fractional.length;
			}

			for (let i = input.length; i--;) {
				const char = input[i];

				if (!/\d/.test(char)) {
					continue;
				}

				addDigit(Number(char));
			}

		} else {
			isNegative = input < resolveNum(0);

			if (isNegative) {
				// @ts-ignore
				input *= resolveNum(-1);
			}

			let i = input;

			do {
				// @ts-ignore
				addDigit(Number(i % resolveNum(10)));

				if (typeof i === 'bigint') {
					i /= 10n;

				} else {
					i = Math.floor(i / 10);
				}

			} while (i > 0);
		}

		if (nibble === 0) {
			addToBuffer(BCD.MASK);
		}

		addToBuffer(isNegative ? BCD.MINUS : BCD.PLUS, this.getShift(BCD.SIGN_INDEX));
		this.store = new Uint8Array(buffer);

		function addDigit(digit: number, resolve = true) {
			addToBuffer(resolve ? that.resolveDigit(digit, isNegative)[0] : digit);

			if (nibble >= BCD.BCD_PER_NUMBER) {
				nibble = 0;
				buffer.push(0);
			}
		}

		function addToBuffer(value: number, shift = nibble * BCD.BCD_SIZE) {
			buffer[buffer.length - 1] |= value << shift;
			nibble++;
		}

		function resolveNum(value: number | bigint): number | bigint {
			return typeof input === 'bigint' ? BigInt(value) : Number(value);
		}
	}

	*entries(params?: Parameters<this['values']>[0]): IterableIterator<[number, number]> {
		let i = 0;

		for (const num of this.values(params)) {
			yield [i, num];
			i++;
		}
	}

	// BCD(12) fit to 3 fixedpoint 2 0 0 1 2 0

	*values(

		{
			sign = false,
			fitTo = this.length,
			fixedPoint = this.fixedPoint
		} = {}

	): IterableIterator<number> {
		fixedPoint = this.fixedPoint - fixedPoint;

		if (fixedPoint < 0) {
			fixedPoint = Math.abs(fixedPoint);

			for (let i = 0; i < fixedPoint; i++) {
				yield (this.isNegative ? BCD.COMPLEMENT9S : BCD.BCD8421)[0];
			}
		}

		let counter = 0;

		iter: for (const [numI, num] of this.store.entries()) {
			const isLastNum = numI === this.store.length - 1;

			for (let i = 0; i < BCD.BCD_PER_NUMBER; i++) {
				if (isLastNum) {
					if (this.isFree(num) || i === BCD.SIGN_INDEX) {
						break iter;
					}
				}

				counter++;
				yield num >>> this.getShift(i) & BCD.MASK;
			}
		}

		for (; counter < fitTo; counter++) {
			yield (this.isNegative ? BCD.COMPLEMENT9S : BCD.BCD8421)[0];
		}

		if (sign) {
			yield this.store.at(-1)! >>> this.getShift(BCD.SIGN_INDEX) & BCD.MASK;
		}
	}

	get(index: number): number {
		if (index < 0) {
			index += this.length;
		}

		if (index < 0 || index > this.length) {
			throw new RangeError('The requested index exceeds the length of the number');
		}

		const
			bufI = Math.floor(index / BCD.BCD_PER_NUMBER),
			shiftI = index % BCD.BCD_PER_NUMBER;

		return this.store[bufI] >>> this.getShift(shiftI) & BCD.MASK;
	}

	abs(): BCD {
		return this.changeSign(false);
	}

	add(a: BCDInput): BCD {
		const
			that = this;

		let
			res = [0];

		const
			aBCD = BCD.resolve(a);

		const
			allNumbersAreNegative = this.isNegative && aBCD.isNegative,
			allNumbersAreNonNegative = !this.isNegative && !aBCD.isNegative,
			needComplement9 = allNumbersAreNegative;

		let
			addition = 0,
			nibble = 0;

		const thisIter = this.values({
			fitTo: aBCD.length,
			fixedPoint: aBCD.fixedPoint
		});

		const aIter = aBCD.values({
			fitTo: this.length,
			fixedPoint: this.fixedPoint
		});

		for (let num1 of thisIter) {
			num1 = resolveComplement9(num1);
			const num2 = resolveComplement9(aIter.next().value!);

			const [sum, overflow] = this.resolveDigit(
				this.binaryAdd(this.binaryAdd(num1, num2), addition)
			);

			addition = overflow;
			addToResult(resolveComplement9(sum));

			if (nibble >= BCD.BCD_PER_NUMBER) {
				nibble = 0;
				res.push(0);
			}
		}

		// 200 fixedPoint 2 = 2.00
		// 50 fixedPoint 1 =  5.00

		if (allNumbersAreNegative || allNumbersAreNonNegative) {
			if (addition) {
				addToResult(resolveComplement9(1));
			}

			addHeader(allNumbersAreNegative);

		} else if (addition) {
			addHeader(false);

			return new BCD(
				new BCD(new Uint8Array(res).buffer).add(1),
				this.fixedPoint
			);

		} else {
			if (res.some(isNonZero)) {
				addHeader(true);

			} else {
				res = res.map(() => 0);
				addHeader(false);
			}
		}

		return new BCD(new Uint8Array(res).buffer, this.fixedPoint);

		function addHeader(isNegative: boolean) {
			if (nibble >= BCD.BCD_PER_NUMBER) {
				nibble = 0;
				res.push(0);
			}

			if (nibble === 0) {
				addToResult(BCD.MASK);
			}

			addToResult(isNegative ? BCD.MINUS : BCD.PLUS, that.getShift(BCD.SIGN_INDEX));
		}

		function resolveComplement9(num: number) {
			return needComplement9 ? BCD.COMPLEMENT9S[num] : num;
		}

		function addToResult(value: number, shift = nibble * BCD.BCD_SIZE)  {
			res[res.length - 1] |= value << shift;
			nibble++;
		}

		function isNonZero(num: number, i: number) {
			const
				halfZero = num === BCD.COMPLEMENT9S[0],
				fullZero = num === (BCD.COMPLEMENT9S[0] | BCD.COMPLEMENT9S[0] << 4);

			if (i === res.length - 1) {
				return num != 0 && !halfZero && !fullZero;
			}

			return !fullZero;
		}
	}

	subtract(a: BCDInput): BCD {
		const aBCD = BCD.resolve(a);
		return this.add(aBCD.changeSign(!aBCD.isNegative));
	}

	multiply(a: BCDInput): BCD {
		const
			initial = this.abs();

		const
			aBCD = BCD.resolve(a),
			aAbs = aBCD.abs();

		if (aBCD.isEqual(0)) {
			return aBCD;
		}

		if (aBCD.isEqual(1)) {
			return this;
		}

		let
			res = initial;

		for (let i = aAbs.integer; !i.isEqual(1); i = i.add(-1)) {
			res = res.add(initial);
		}

		const fractional = aAbs.fractional;

		if (!fractional.isEqual(0)) {
			res = res.add(
				res.multiply(fractional).divide(fractional.length * 10)
			);
		}

		if (this.isNegative && !aBCD.isNegative || !this.isNegative && aBCD.isNegative) {
			res = res.changeSign(true);
		}

		return res;
	}

	divide(a: BCDInput): BCD {
		const
			initial = this.abs();

		const
			aBCD = BCD.resolve(a),
			aAbs = aBCD.abs();

		if (aBCD.isEqual(0)) {
			throw new RangeError('BCD division by zero');
		}

		let
			res = new BCD(0);

		let
			int = initial,
			divider = aAbs.integer;

		const
			needChangeSign = this.isNegative && !aBCD.isNegative || !this.isNegative && aBCD.isNegative;

		if (divider.isEqual(int)) {
			return int.changeSign(needChangeSign);
		}

		if (divider.isGreaterOrEqual(int)) {
			return res;
		}

		while (int.isGreaterOrEqual(divider)) {
			int = int.subtract(divider);
			res = res.add(1);
		}

		if (!int.isEqual(0) && this.fixedPoint !== 0) {
			let fractional = int.multiply(100).divide(divider);

			// FIXME нужно корректно округлять
			if (fractional.length > this.fixedPoint) {
				fractional = new BCD(
					fractional.store.slice(Math.floor((fractional.length - this.fixedPoint) / 2)).buffer,
					this.fixedPoint
				);
			}

			res = res.add(new BCD(fractional, this.fixedPoint));
			res = new BCD(res, this.fixedPoint);
		}

		// const fractional = aAbs.fractional;
		//
		// if (!fractional.isEqual(0)) {
		// 	res = res.subtract(res.multiply(fractional).divide(fractional.length * 10));
		// }

		return res.changeSign(needChangeSign);
	}

	isEqual(a: BCDInput): boolean {
		const aBCD = BCD.resolve(a);

		if (this.isNegative && !aBCD.isNegative || !this.isNegative && aBCD.isNegative) {
			return false;
		}

		const thisIter = this.values({
			fitTo: aBCD.length,
			fixedPoint: aBCD.fixedPoint
		});

		const aIter = aBCD.values({
			fitTo: this.length,
			fixedPoint: this.fixedPoint
		});

		for (const num1 of thisIter) {
			if (num1 !== aIter.next().value) {
				return false;
			}
		}

		return true;
	}

	isGreaterOrEqual(a: BCDInput): boolean {
		const aBCD = BCD.resolve(a);

		if (this.isNegative && !aBCD.isNegative) {
			return false;
		}

		if (!this.isNegative && aBCD.isNegative) {
			return true;
		}

		const thisNums = Array.from(this.values({
			fitTo: aBCD.length - aBCD.fixedPoint,
			fixedPoint: aBCD.fixedPoint
		})).reverse();

		const aNums = Array.from(aBCD.values({
			fitTo: this.length - this.fixedPoint,
			fixedPoint: this.fixedPoint
		})).reverse();

		for (const [i, num1] of thisNums.entries()) {
			const subtract = new BCD(num1).subtract(aNums[i] ?? 0);

			if (subtract.isEqual(0)) {
				continue;
			}

			return !subtract.isNegative;
		}

		return true;
	}

	valueOf(): ArrayBuffer {
		return this.buffer;
	}

	toString(): string {
		let res = '';

		const values = Array.from(this.values())
			.map((num) => this.isNegative ? BCD.COMPLEMENT9S[num] : num);

		while (values.length < this.fixedPoint) {
			values.push(0);
		}

		values.reverse();

		let
			skip = true,
			hasDot = this.fixedPoint === 0,
			addZero = false;

		for (const [i, num] of values.entries()) {
			if (!hasDot && values.length - i <= this.fixedPoint) {
				if (res === '') {
					res += '0';
				}

				res += '.';

				hasDot = true;
				skip = false;
				addZero = false;
			}

			if (num === 0 && skip) {
				addZero = true;
				continue;
			}

			skip = false;
			addZero = false;
			res += String(num);
		}

		if (addZero) {
			res = '0' + res;
		}

		if (this.isNegative) {
			res = '-' + res;
		}

		return res;
	}

	toNumber(): number {
		let
			res = 0,
			rank = 1;

		for (const num of this.values()) {
			res += (this.isNegative ? BCD.COMPLEMENT9S[num] : num) * rank;
			rank *= 10;
		}

		if (this.isNegative) {
			res *= -1;
		}

		if (this.fixedPoint !== 0) {
			res *= 10 ** -this.fixedPoint;
		}

		return res;
	}

	toBigInt(): bigint {
		let
			res = 0n,
			rank = 1n;

		for (const num of this.values()) {
			res += BigInt(this.isNegative ? BCD.COMPLEMENT9S[num] : num) * rank;
			rank *= 10n;
		}

		if (this.isNegative) {
			res *= -1n;
		}

		return res;
	}

	changeSign(toNegative: boolean): BCD {
		if (this.isNegative && toNegative || !this.isNegative && !toNegative) {
			return this;
		}

		const values = Array.from(this.values()).map((num) => BCD.COMPLEMENT9S[num]);
		values.push(toNegative ? BCD.MINUS : BCD.PLUS);

		return new BCD(values, this.fixedPoint);
	}

	protected isFree(value: number): boolean {
		return (value & BCD.MASK) === BCD.MASK;
	}

	protected getShift(i: number): number {
		if (i > BCD.BCD_PER_NUMBER) {
			throw new RangeError(`The index cannot be greater than ${BCD.BCD_PER_NUMBER}`);
		}

		return i * BCD.BCD_SIZE;
	}

	protected resolveDigit(digit: number, isNegative = false): [number, 0 | 1] {
		let overflow = 0;

		if (isNegative) {
			digit = BCD.COMPLEMENT9S[digit];
		}

		if (BCD.BCD8421[digit] == null) {
			const normalized = this.binaryAdd(digit, 6);
			digit = normalized & BCD.MASK;
			overflow = normalized & ~BCD.MASK;
		}

		return [digit, overflow !== 0 ? 1 : 0];
	}

	protected binaryAdd(x: number, y: number): number {
		while (y) {
			let carry = x & y;
			x = x ^ y;
			y = carry << 1;
		}

		return x;
	}
}

console.log(new BCD(7, 1).divide(2).toNumber())

{
	equal(new BCD(1023, 2).toNumber(), 10.23);
	equal(new BCD('1023.678').toNumber(), 1023.678);
	equal(new BCD(1023, 2).toBigInt(), 1023);
	equal(new BCD(1023, 2).toString(), '10.23');
	equal(new BCD(-1023, 7).toString(), '-0.0001023');
}

{
	equal(new BCD(10021, 2).subtract(99).toString(), '1.21');
	equal(new BCD(34.23).subtract(150.64).toNumber(), -116.41);
}

{
	equal(new BCD(0).add(-0n).toNumber(), 0);
	equal(new BCD(10).add(0n).toNumber(), 10);
	equal(new BCD(1).add(-10n).toNumber(), -9);
	equal(new BCD(-99).add(-789n).toNumber(), -888);
	equal(new BCD(97).add(-85n).toNumber(), 12);
	equal(new BCD(999).add(999).toBigInt(), 1998n);
}

{
	equal(new BCD(10n).subtract(5n).toNumber(), 5);
	equal(new BCD(10n).subtract(17n).toNumber(), -7);
	equal(new BCD(10n).subtract(-17n).toNumber(), 27);
	equal(new BCD(-10n).subtract(7n).toNumber(), -17);
}

{
	equal(new BCD(10).multiply(5n).toNumber(), 50);
	equal(new BCD(-7).multiply(19n).toNumber(), -133);
	equal(new BCD(-627).multiply(-3017n).toBigInt(), 1891659n);
}

{
	equal(new BCD(10).divide(2).toNumber(), 5);
	equal(new BCD(11).divide(2n).toNumber(), 5);
	equal(new BCD(12).divide(2).toNumber(), 6);
	equal(new BCD(12).divide(-3n).toNumber(), -4);
	equal(new BCD(-21).divide(-3).toNumber(), 7);
	equal(new BCD(1895n).divide(37n).toNumber(), 51);
}

{
	const bcd = new BCD(123456789n);

	deepEqual(bcd.store, new Uint8Array([
		9 | 8 << 4,
		7 | 6 << 4,
		5 | 4 << 4,
		3 | 2 << 4,
		1 | BCD.PLUS << 4
	]));

	equal(bcd.toString(), '123456789');
	equal(bcd.toNumber(), 123456789);
	equal(bcd.toBigInt(), 123456789n);

	equal(bcd.length, 9);
	equal(bcd.freeSlots, 0);
	equal(bcd.isNegative, false);

	equal(bcd.get(0), 9);
	equal(bcd.get(3), 6);
	equal(bcd.get(7), 2);
	equal(bcd.get(8), 1);

	equal(bcd.get(-1), 1);
	equal(bcd.get(-2), 2);
	equal(bcd.get(-3), 3);
	equal(bcd.get(-8), 8);
	equal(bcd.get(-9), 9);
}

{
	const bcd = new BCD(123456789);

	deepEqual(bcd.store, new Uint8Array([
		9 | 8 << 4,
		7 | 6 << 4,
		5 | 4 << 4,
		3 | 2 << 4,
		1 | BCD.PLUS << 4
	]));
}
