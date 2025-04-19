interface TrieNode {
	char: string;
	word: boolean;
	children: Map<string, number>;
}

export class Trie {
	protected buffer: TrieNode[] = [{char: '', word: false, children: new Map()}];

	addWord(word: string): void {
		let
			cursor = 0;

		for (const char of word) {
			const
				current = this.buffer[cursor];

			if (current.children.has(char)) {
				cursor = current.children.get(char)!;

			} else {
				const trieNode = {
					char,
					word: false,
					children: new Map()
				};

				const pointer = this.buffer.push(trieNode) - 1;
				current.children.set(char, pointer);
				cursor = pointer;
			}
		}

		this.buffer[cursor].word = true;
	}

	go(char: string): TrieView {
		return new TrieView(0, this.buffer).go(char);
	}
}

export class TrieView {
	constructor(protected start: number, protected buffer: TrieNode[]) {}

	go(char: string) {
		if (this.start === -1 || this.buffer[this.start] == null) {
			return this;
		}

		return new TrieView(this.buffer[this.start].children.get(char) ?? -1, this.buffer);
	}

	isWord(): boolean {
		if (this.start === -1 || this.buffer[this.start] == null) {
			return false;
		}

		return this.buffer[this.start].word;
	}
}

const trie = new Trie();

trie.addWord('мясо');
trie.addWord('мясорубка');
trie.addWord('мир');

console.log(trie.go('м').go('я').go('с').go('о').isWord()); // true
console.log(trie.go('м').go('и').go('р').isWord()); // true
