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
  negativeBit = 0b0111_0000_0000_0000_0000_0000_0000_0000;
  // numberLength = 0;
  maxBCD = 7;
  info = { numberLength: 0 };

  createMask(pos) {
    let r = ~0;
    r <<= 28;
    r >>>= 32 - pos;
    return r;
  }

  complementTo9(number) {
    let result = "";
    while (number > 0n) {
      let digit = number % 10n;
      result = (9n - digit).toString() + result;
      number = number / 10n;
    }
    return BigInt(result);
  }

  createBCDArray(num, info) {
    let isNegative = num < 0;
    let byteNumber = 0;
    let filledBCD = this.maxBCD;
    num = isNegative ? this.complementTo9(-num) : num;
    const numbers = [];

    for (let char of num.toString()) {
      info.numberLength = ++info.numberLength;

      if (!filledBCD) {
        if (isNegative) {
          byteNumber |= this.negativeBit;
          isNegative = false;
        }
        numbers.push(byteNumber);
        byteNumber = 0;
        filledBCD = this.maxBCD;
      }
      const digit = Number(char);

      byteNumber = (byteNumber << 4) | digit;
      filledBCD--;
    }

    if (isNegative) {
      byteNumber |= this.negativeBit;
    }
    numbers.push(byteNumber);

    return numbers;
  }

  createBCD(arrayNumbers) {
    let byteNumber = 0;
    let filledBCD = this.maxBCD;

    const numbers = [];

    arrayNumbers.forEach((num, index) => {
      if (!filledBCD) {
        numbers.push(byteNumber);
        byteNumber = 0;
        filledBCD = this.maxBCD;
      }

      byteNumber = byteNumber | (num << (4 * index));
      filledBCD--;
    });

    numbers.push(byteNumber);

    return numbers;
  }

  constructor(num) {
    this.number = num;
    this.numbers = this.createBCDArray(num, this.info);
  }

  bitLength(num) {
    let bits = 0n;
    while (num > 0n) {
      bits++;
      num >>= 1n;
    }
    return ((bits + 3n) / 4n) * 4n;
  }

  combineBCD(numArray, isNegative) {
    const num = numArray.reduce((left, right, index) => {
      if (index === 0 && isNegative) {
        right ^= this.negativeBit;
      }

      return (BigInt(left) << this.bitLength(BigInt(right))) | BigInt(right);
    }, 0);

    return num;
  }

  valueOf(base) {
    const num = this.combineBCD(this.numbers, this.isNegative);
    return base ? num.toString(base) : num;
  }

  getFirstBitsBCD(num) {
    const leftShift = 28;
    return (num << leftShift) >>> leftShift;
  }

  getNumBCD(numbers, pos, numberLength) {
    if (pos < 0) {
      pos += numberLength;
    }
    const index = Math.floor(pos / this.maxBCD);
    pos = pos % this.maxBCD;
    if (index === numbers.length - 1) {
      pos += this.maxBCD * numbers.length - numberLength;
    }

    const num = numbers[index];

    const leftShift = pos + 1;
    return (num << (4 * leftShift)) >>> 28;
  }

  get(pos) {
    return this.getNumBCD(this.numbers, pos, this.info.numberLength);
  }

  get isNegative() {
    return (this.numbers[0] & (~0 << 28)) === this.negativeBit;
  }

  getBCDArray() {
    return this.numbers.forEach((num) => {
      console.log("🚀 ~ n:", binary2(num), num);
    });
  }

  sum2Numbers(num1, num2) {
    let result = 0;
    let sumWithoutShift = num1 ^ num2; //1110
    let shiftBits = num1 & num2; //0001
    result = sumWithoutShift;

    while (shiftBits) {
      shiftBits <<= 1;

      sumWithoutShift ^= shiftBits;
      shiftBits &= result;
      result = sumWithoutShift;
    }

    return result;
  }

  add(num, isSub) {
    let shift = 0;
    const correctNum = 0b0110;
    const info = { numberLength: 0 };
    const addendBCD = this.createBCDArray(num, info);
    const maxLength = Math.max(info.numberLength, this.info.numberLength);
    const resultBCD = [];

    for (let i = -1; i >= -maxLength; i--) {
      const num1 = this.get(i) ?? 0;
      const num2 = this.getNumBCD(addendBCD, i, info.numberLength) ?? 0;

      let result = this.sum2Numbers(num1, num2);
      result = this.sum2Numbers(result, shift);

      if (result > 9) {
        result = this.sum2Numbers(result, correctNum);
      }
      if (result >= 0b1_0000) {
        shift = 1;
      } else {
        shift = 0;
      }
      resultBCD.push(this.getFirstBitsBCD(result));
    }

    if (!isSub) {
      resultBCD.push(shift);
    }

    const resultArr = this.createBCD(resultBCD);
    this.numbers = resultArr;

    if (isSub) {
      return this.add(shift);
    }

    return this.combineBCD(this.numbers);
  }

  alignNumbers(num1, num2) {
    let length1 = 0n;
    let length2 = 0n;
    let temp1 = num1;
    let temp2 = num2;

    while (temp1 > 0n) {
      temp1 /= 10n;
      length1++;
    }
    while (temp2 > 0n) {
      temp2 /= 10n;
      length2++;
    }

    num2 += 10n ** length1 - 1n - (10n ** length2 - 1n);

    return num2;
  }

  complementTo9BCD(bcdArr) {
    return bcdArr.map((num) => {
      for (let i = this.maxBCD; i > 0; i--) {
        const mask = this.createMask(i * 4);
        const shift = 4 * i - 4;
        const bcd = (num & mask) >>> shift;
        if (!bcd) continue;
        const bcdTo9 = 9 - bcd;
        num = (num & ~mask) | (bcdTo9 << shift);
      }

      return num;
    });
  }

  subtract(num) {
    if(this.number === num) {
      this.numbers = [0n]
      return 0n
    }
    if(num < 0) {
      return this.add(-num);
    }
    if (this.number > num) {
      const subtractBCD = this.complementTo9(num);
      const subNum = this.alignNumbers(this.number, subtractBCD);
      return this.add(subNum, true);
    } else {
      const subNum = this.complementTo9(num);
      this.add(subNum);
      this.numbers = this.complementTo9BCD(this.numbers);
      this.numbers[0] |= this.negativeBit
      return this.valueOf()
    }
  }
}

const n = new BCD(-1n);
n.getBCDArray();
console.log("🚀 ~ n: valueOf", n.valueOf());
console.log("🚀 ~ n:", n.get(-1));
console.log("🚀 ~ n:", n.isNegative);

// console.log("n.add", n.add(67n).toString(2)); // 0b00100101 или 37
console.log("n.subtract", n.subtract(-11n)?.toString(2));
