class TrieNode {
  constructor(
    public value: string,
    public children: Record<string, number>,
    public isWord: boolean
  ) {}
}

class Trie {
  buffer: TrieNode[] = [new TrieNode("", {}, false)];
  private currentNode = this.buffer[0];

  addWord(str: string | string[]) {
    const root = this.buffer[0];
    let word = "";
    let prevNode: TrieNode = this.buffer[0];
    for (const [index, char] of [...str].entries()) {
      const isWord = index === str.length - 1;
      word += char;

      if (prevNode?.children[char]) {
        prevNode = this.buffer[prevNode.children[char]];
        prevNode.isWord = isWord || prevNode.isWord;
        continue;
      }

      let node = new TrieNode(word, {}, isWord);

      if (!root.children[char] && index === 0) {
        root.children[char] = this.buffer.length;
        this.buffer.push(node);
      } else {
        this.buffer.push(node);
        prevNode.children[char] = this.buffer.length - 1;
      }

      prevNode = node;
    }
  }

  go(char: string) {
    this.currentNode = this.buffer[this.currentNode.children[char]];
    return this;
  }

  isWord() {
    console.log("🚀 ~ Trie ~ isWord ~ this.currentNode:", this.currentNode);

    return this.currentNode.isWord;
  }
}

const trie = new Trie();

trie.addWord("мясо");
trie.addWord("мясорубка");
trie.addWord("мир");
trie.addWord("мяс");

console.log("🚀 ~ trie:", trie.buffer);

console.log(trie.go("м").go("я").go("с").go("о").isWord()); // true

function match(pattern: string, words: string[]) {
  const splitPattern = [...pattern.split(".").entries()];
  const matchedWords: string[] = [];

  wordsLoop: for (const word of words) {
    const splitWord = word.split(".");

    if (
      splitWord.length !== splitPattern.length &&
      splitPattern[splitPattern.length - 1][1] !== "**"
    ) {
      continue;
    }

    for (const [index, patternPart] of splitPattern) {
      const wordPart = splitWord[index];

      if (patternPart === "**") {
        matchedWords.push(word);
        continue wordsLoop;
      }

      if (wordPart !== patternPart && patternPart !== "*") {
        continue wordsLoop;
      }
    }

    matchedWords.push(word);
  }

  return matchedWords;
}

console.log(
  match("foo.*.bar.**", ["foo", "foo.bla.bar.baz", "foo.bag.bar.ban.bla"])
); // ['foo.bla.bar.baz', 'foo.bag.bar.ban.bla']
