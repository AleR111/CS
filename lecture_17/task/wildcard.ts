export class TrieNode {
	word = false;

	aliases: string[][] = [];
	children = new Map<string, TrieNode>();

	constructor(public value: string[]) {}
}

export class Trie {
	protected root = new TrieNode([]);

	addWord(word: Iterable<string>) {
		let
			cursor = this.root,
			wildcard: TrieNode | null = null;

		for (const chunk of word) {
			const
				current = cursor;

			if (current.children.has('*')) {
				wildcard = current.children.get('*')!;

			} else {
				wildcard = createNode('*', current);
			}

			if (current.children.has(chunk)) {
				cursor = current.children.get(chunk)!;

			} else {
				const trieNode = createNode(chunk, current);
				wrapSet(trieNode.children, wildcard.children);
				cursor = trieNode;
			}
		}

		if (wildcard != null) {
			cursor.word = true;
			wildcard.aliases.push(cursor.value);
		}

		function createNode(chunk: string, parent: TrieNode) {
			const trieNode = new TrieNode(parent.value.concat(chunk));
			parent.children.set(chunk, trieNode);
			return trieNode;
		}

		function wrapSet(map: Map<any, any>, wildcardMap: Map<any, any>) {
			const {set} = map;

			map.set = function (key, value) {
				wildcardMap.set(key, [].concat(wildcardMap.get(key) ?? [], value));
				return set.call(map, key, value);
			};

			return wrapSet;
		}
	}

	go(char: string) {
		return new TrieView([this.root]).go(char);
	}
}

export class TrieView {
	constructor(protected startNodes: TrieNode[]) {}

	get isCompleted() {
		return this.startNodes.length === 0;
	}

	get words(): string[][] {
		if (this.isCompleted) {
			return [];
		}

		return this.startNodes.flatMap(({word, value, aliases}) => word ? [value] : aliases)
	}

	go(char: string) {
		if (this.isCompleted) {
			return this;
		}

		const startNodes = this.startNodes.flatMap((node) => node.children.get(char) ?? []);
		return new TrieView(startNodes);
	}
}

function match(pattern: string, strings: string[], sep = '.') {
	const res: string[] = [];

	const
		patternChunks = pattern.split(sep),
		canExpandPattern = patternChunks.at(-1) === '**';

	if (patternChunks.length === 0) {
		return res;
	}

	const trie = new Trie();
	strings.forEach((str) => trie.addWord(str.split(sep)));
	console.dir(trie,  { depth: null })

	if (canExpandPattern) {
		patternChunks.pop();
	}

	const
		minSize = patternChunks.length,
		maxSize = canExpandPattern ? Infinity : minSize;

	let
		cursor: Trie | TrieView = trie;

	patternChunks.forEach((str) => {
		cursor = cursor.go(str);

		cursor.words.forEach((value) => {
			if (canExpandPattern ? value.length >= minSize : value.length === maxSize) {
				res.push(value.join(sep));
			}
		});
	});

	if (canExpandPattern) {
		for (cursor = cursor.go('*'); !cursor.isCompleted; cursor = cursor.go('*')) {
			res.push(...cursor.words.map((value) => value.join(sep)));
		}
	}

	return res;
}

// console.log(match('foo.*', ['foo.baz', 'foo.bar.bla'])); // ['foo.bla.bar.baz', 'foo.bag.bar.ban.bla']
console.log(match('foo.*.bar.**', ['foo.bla.bar.baz'])); // ['foo.bla.bar.baz', 'foo.bag.bar.ban.bla']
