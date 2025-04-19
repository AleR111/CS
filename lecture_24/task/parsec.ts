import { intoIter, intoBufIter, seq as iterSeq } from './iter';

type Test = string | RegExp | ((char: string) => boolean);

interface ParserToken<T = unknown> {
	type: string;
	value?: T;
}

interface ParserValue<T = unknown> extends ParserToken<T> {}

type ParserResult<T = unknown> = [ParserValue<T>, Iterable<string>];

type Parser<T = unknown, R = unknown> =
	(iterable: Iterable<string>, prev?: ParserValue) =>
		Generator<ParserToken<T>, ParserResult<R>>;

class ParserError extends Error {
	prev: ParserValue | null;

	constructor(message: string, prev: ParserValue | null = null) {
		super(message);
		this.prev = prev;
	}
}

function testChar(
	test: Test,
	char: string,
	prev: ParserValue | undefined
): boolean {
	switch (typeof test) {
		case 'string':
			if (test !== char) {
				throw new ParserError('Invalid string', prev);
			}

			break;

		case 'function':
			if (!test(char)) {
				throw new ParserError('Invalid string', prev);
			}

			break;

		default:
			if (!test.test(char)) {
				throw new ParserError('Invalid string', prev);
			}
	}

	return true;
}

interface ParserOptions<T = unknown, R = T> {
	token?: string;
	tokenValue?(value: T): R;
}

function tag(pattern: Iterable<Test>, opts: ParserOptions<string> = {}): Parser<string, string> {
	return function* (source, prev) {
		let iter = intoIter(source);

		let value = '';

		for (const test of pattern) {
			let
				chunk = iter.next(),
				char = chunk.value;

			if (chunk.done) {
				throw new Error('Insufficient data for parsing');
			}

			testChar(test, char, prev);
			value += char;
		}

		if (opts.token) {
			yield {
				type: opts.token,
				value: opts.tokenValue?.(value) ?? value
			}
		}

		const token = {
			type: 'TAG',
			value,
		};

		return [token, iter];
	};
}

// const rgb = tag(['#', /[\dA-F]/, /[\dA-F]/, /[\dA-F]/, /[\dA-F]/, /[\dA-F]/, /[\dA-F]/], {
// 	token: 'RGB',
// 	tokenValue(value: string): string {
// 		return value.slice(1);
// 	}
// })('#FFEE00');
//
// console.log(...rgb);

interface TakeOptions extends ParserOptions<string> {
	min?: number;
	max?: number;
}

function take(test: Test, opts: TakeOptions = {}): Parser<string, string> {
	return function* (source, prev) {
		const {
			min = 1,
			max = Infinity
		} = opts;

		const buffer = [];

		let
			iter = intoIter(source),
			count = 0,
			value = '';

		while (true) {
			if (count >= max) {
				break;
			}

			let
				chunk = iter.next(),
				char = chunk.value;

			if (chunk.done) {
				if (count >= min) {
					break;
				}

				throw new ParserError('Insufficient data for parsing', prev);
			}

			try {
				if (testChar(test, char, prev)) {
					count++;
				}

			} catch (err) {
				if (count < min) {
					throw err;
				}

				buffer.push(char);
				break;
			}

			value += char;
		}

		if (opts.token && count > 0) {
			yield {
				type: opts.token,
				value: opts.tokenValue?.(value) ?? value
			}
		}

		const token = {
			type: 'TAKE',
			value,
		};

		return [token, buffer.length > 0 ? iterSeq(buffer, iter) : iter];
	};
}


function seq<T = unknown>(...parsers: Parser[]): Parser<T[], T[]>;

function seq<T = unknown, R = unknown>(opts: ParserOptions<T[], R>, ...parsers: Parser[]): Parser<R | T[], R>;

function seq(optsOrParser: ParserOptions | Parser, ...parsers: Parser[]): Parser {
	let opts: ParserOptions = {};

	if (typeof optsOrParser === 'function') {
		parsers.unshift(optsOrParser);

	} else {
		opts = optsOrParser;
	}

	return function* (source, prev) {
		const value = [];

		let iter = intoIter(source);

		for (const parser of parsers) {
			const parsing = parser(iter, prev);

			while (true) {
				const chunk = parsing.next();

				if (chunk.done) {
					prev = chunk.value[0];
					value.push(prev);
					iter = intoIter(chunk.value[1]);
					break;

				} else {
					yield chunk.value;
				}
			}
		}

		if (opts.token) {
			yield {
				type: opts.token,
				value: opts.tokenValue?.(value) ?? value
			};
		}

		const token = {
			type: 'SEQ',
			value
		};

		return [token, iter];
	};
}


function or<T = unknown, R = unknown>(...parsers: Parser[]): Parser<T, R>;

function or<T = unknown, R = unknown>(opts: ParserOptions<T, R>, ...parsers: Parser[]): Parser<T | R, R>;

function or(optsOrParser: ParserOptions | Parser, ...parsers: Parser[]): Parser {
	let opts: ParserOptions = {};

	if (typeof optsOrParser === 'function') {
		parsers.unshift(optsOrParser);

	} else {
		opts = optsOrParser;
	}

	return function* (source, prev) {
		const yields = [];

		let
			value,
			done = false;

		let iter = intoIter(source);

		outer: for (const parser of parsers) {
			const
				buffer: string[] = [],
				parsing = parser(intoBufIter(iter, buffer), prev);

			while (true) {
				try {
					const chunk = parsing.next();

					if (chunk.done) {
						done = true;
						value = chunk.value[0];
						iter = intoIter(chunk.value[1]);
						break outer;

					} else {
						yields.push(chunk.value);
					}

				} catch (err) {
					iter = buffer.length > 0 ? iterSeq(buffer, iter) : iter;
					yields.splice(0, yields.length);
					break;
				}
			}
		}

		if (!done) {
			throw new ParserError('Invalid data', prev);
		}

		yield* yields;

		if (opts.token) {
			yield {
				type: opts.token,
				value: opts.tokenValue?.(value) ?? value
			}
		}

		const token = {
			type: 'OR',
			value
		};

		return [token, iter];
	};
}

interface RepeatOptions<T = unknown, R = T> extends ParserOptions<ParserValue<T>[], R> {
	min?: number;
	max?: number;
}

function repeat<T>(parser: Parser<T>): Parser<T[], T[]>;

function repeat<T = unknown, R = unknown>(parser: Parser<T>, opts: RepeatOptions<T, R>): Parser<R | T[], R | T[]>;

function repeat(parser: Parser, opts: RepeatOptions = {}): Parser {
	return function* (source, prev) {
		const {
			min = 1,
			max = Infinity
		} = opts;

		const globalBuffer: string[] = [];

		const
			value= [],
			yields = [];

		let
			iter = intoIter(source),
			count = 0;

		outer: while (true) {
			const
				buffer= count >= min ? [] : globalBuffer,
				parsing = parser(intoBufIter(iter, buffer), prev);

			while (true) {
				if (count >= max) {
					yield* yields;
					break outer;
				}

				try {
					const chunk = parsing.next();

					if (chunk.done) {
						prev = chunk.value[0];
						iter = intoIter(chunk.value[1]);

						value.push(prev);
						count++;

						if (count >= min) {
							yield* yields.splice(0, yields.length);
						}

						break;

					} else {
						yields.push(chunk.value);
					}

				} catch (err) {
					if (count < min) {
						throw err;
					}

					iter = buffer.length > 0 ? iterSeq(buffer, iter) : iter;
					break outer;
				}
			}
		}

		if (opts.token && count > 0) {
			yield {
				type: opts.token,
				value: opts.tokenValue?.(value) ?? value
			}
		}

		const token = {
			type: 'REPEAT',
			value
		};

		return [token, iter];
	};
}

const rgb = seq(
	{token: 'COLOR'},
	tag('#'),
	or(
		take(/[\dA-F]/, {min: 8, max: 8}),
		take(/[\dA-F]/, {min: 6, max: 6}),
		take(/[\dA-F]/, {min: 3, max: 3})
	)
);


function opt<T>(parser: Parser<T>): Parser<T[], T[]>;

function opt<T = unknown, R = unknown>(parser: Parser<T>, opts?: ParserOptions<T[], R>): Parser<R | T[], R | T[]>;

function opt(parser: Parser, opts?: ParserOptions): Parser {
	return repeat(parser, {min: 0, max: 1, ...opts});
}

const ws = take(/\s/, {min: 0});

const sign = take(/[\-+]/, {
	min: 0,
	max: 1,
	token: 'NUMBER_SIGN'
});

const exp = seq(
	tag([/e/i]),
	take(/[\-+]/, {token: 'EXP_SIGN', min: 0, max: 1}),
	take(/\d/, {token: 'EXP_VALUE'})
);

const fractional = seq(
	tag('.'),
	take(/\d/, {token: 'FRACTIONAL_VALUE'})
);

const number = seq(
	sign,

	seq(
		or(
			seq(
				tag('0', {token: 'INT_VALUE'}),
				fractional
			),

			seq(
				seq(
					{
						token: 'INT_VALUE',
						tokenValue: (value: ParserToken[]) => {
							return value.reduce((res, {value}) => res + value, '');
						}
					},

					tag([/[1-9]/]),
					take(/\d/, {min: 0}),
				),

				opt(fractional)
			)
		),

		opt(exp)
	)
);

const string = seq(
	{
		token: 'STRING_VALUE',
		tokenValue(value: ParserToken[]) {
			return value.reduce((res, {value}) => res + value, '');
		}
	},

	tag('"'),
	take(/[^"]/),
	tag('"')
);

const boolean = or(
	{
		token: 'BOOLEAN_VALUE',
		tokenValue({value}) {
			return value;
		}
	},

	tag('true'),
	tag('false')
);

const json = (
	source: Iterable<string>,
	prev?: ParserValue | undefined
) => or(string, boolean, number, array, object)(source, prev);

const array: Parser = seq(
	tag('[', {token: 'ARRAY_START'}),
	ws,

	repeat(seq(ws, json, ws, tag(','), ws), {min: 0}),
	opt(json),

	ws,
	tag(']', {token: 'ARRAY_END'}),
);

const objectKey = seq(
	{
		token: 'OBJECT_KEY',
		tokenValue(value: ParserToken[]) {
			return value[1].value;
		}
	},

	tag('"'),
	take(/[^"]/),
	tag('"'),
	ws,
	tag(':'),
	ws
);

const objectValue = seq(ws, objectKey, ws, json, ws);

const object = seq(
	tag('{', {token: 'OBJECT_START'}),
	ws,

	repeat(seq(ws, objectValue, ws, tag(','), ws), {min: 0}),
	opt(objectValue),

	ws,
	tag('}', {token: 'OBJECT_END'}),
);

const p = json('[1234453.444, {"A": "sdsd"}]');

console.dir([...p], {depth: null});
