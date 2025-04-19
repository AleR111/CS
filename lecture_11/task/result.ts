class HashMap {
  buffer: any[];
  capacity: number;

  constructor(capacity: number) {
    this.buffer = new Array(capacity);
    this.capacity = capacity;
  }

  set(key: any, value: any) {
    this.buffer[this.hash(key)] = value;
  }

  private hash(key: any) {
    let hash = 0;
    const keyStr = typeof key === "object" ? JSON.stringify(key) : String(key);
    for (let i = 0; i < keyStr.length; i++) {
      hash = (hash * 31 + keyStr.charCodeAt(i)) % this.capacity;
    }
    return hash;
  }
}

const map = new HashMap(120);

map.set("foo", 1);
map.set(42, 10);
map.set(document, 100);

console.log(map.get(42)); // 10
console.log(map.has(document)); // true
console.log(map.delete(document)); // 10
console.log(map.has(document)); // false
