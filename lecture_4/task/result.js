//BCD 8421

function binary(num) {
  return num.toString(2).padStart(32, "0");
}

binary(0b0010 << 1);

function binary2(num) {
  const str = new Uint32Array([num])[0].toString(2);
  return "0b" + str.padStart(32, "0").replace(/(.{4})(?!$)/g, "$1_");
}

function createMask(len, pos) {
  let r = ~0;
  r <<= 32 - len;
  r >>>= 32 - pos; // Надо использовать логический сдвиг
  return r;
}

const encoded = (13 << 24) | (56 << 16) | (128 << 8) | 204;
// console.log((encoded & createMask(8, 24)) >>> 16);

class BCD {
  numbers = [];

  constructor(num) {
    let byteNumber = 0;
    const maxBCD = 7;
    let filledBCD = maxBCD;

    for (let char of num.toString()) {
      if (!filledBCD) {
        this.numbers.push(byteNumber);
        byteNumber = 0;
        filledBCD = maxBCD;
      }
      const digit = Number(char);

      byteNumber = (byteNumber << 4) | digit;
      filledBCD--;
    }

    this.numbers.push(byteNumber);
  }

  bitLength(num) {
    let bits = 0n;
    while (num > 0n) {
      bits++;
      num >>= 1n;
    }
    return ((bits + 3n) / 4n) * 4n;
  }

  valueOf(base) {
    const num = this.numbers.reduce((left, right) => {
      return (BigInt(left) << this.bitLength(BigInt(right))) | BigInt(right);
    }, 0);
    return base ? num.toString(base) : num;
  }

  get(pos) {
    const num = this.numbers[0];

    if (pos < 0) {
      return (num << (32 - Math.abs(pos) * 4)) >>> 28;
    } else {
      const leftShift = pos + 1;
      return (num << (4 * leftShift)) >>> 28;
    }
  }

  getBCDArray() {
    return this.numbers.forEach((num) => {
      console.log("🚀 ~ n:", binary2(num), num);
    });
  }
}

const n = new BCD(-6553636n);
n.getBCDArray();
console.log("🚀 ~ n:", n.valueOf());
console.log("🚀 ~ n:", n.get(-1));
