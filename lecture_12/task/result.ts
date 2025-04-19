const arr = [
  { age: 12, name: "Bob" },
  { age: 42, name: "Ben" },
  { age: 42, name: "Jack" },
  { age: 42, name: "Sam" },
  { age: 56, name: "Bill" },
];

// Если число положительное, то значит надо идти налево.
// Если число 0, то значит надо запомнить позицию и идти налево.
// Если число отрицательное, то значит идти налево.

function indexOf(array: any[], comparator: (value: any) => number) {
  let leftIndex = 0;
  let rightIndex = array.length - 1;
  let result = -1;

  while (leftIndex <= rightIndex) {
    const middleIndex = Math.floor((leftIndex + rightIndex) / 2);

    const compareResult = comparator(array[middleIndex]);

    if (compareResult === 0) {
      result = middleIndex;
      rightIndex = middleIndex - 1;
    } else if (compareResult < 0) {
      leftIndex = middleIndex + 1;
    } else {
      rightIndex = middleIndex - 1;
    }
  }

  return result;
}

function lastIndexOf(array: any[], comparator: (value: any) => number) {
  let leftIndex = 0;
  let rightIndex = array.length - 1;
  let result = -1;

  while (leftIndex <= rightIndex) {
    const middleIndex = Math.floor((leftIndex + rightIndex) / 2);

    const compareResult = comparator(array[middleIndex]);

    if (compareResult === 0) {
      result = middleIndex;
      leftIndex = middleIndex + 1;
    } else if (compareResult < 0) {
      leftIndex = middleIndex + 1;
    } else {
      rightIndex = middleIndex - 1;
    }
  }

  return result;
}

console.log(
  "🚀 ~ indexOf:",
  indexOf(arr, ({ age }) => age - 42) // 1
);

console.log(
  "🚀 ~ lastIndexOf:",
  lastIndexOf(arr, ({ age }) => age - 42) // 3
);

console.log(
  "🚀 ~ lastIndexOf:",
  lastIndexOf(arr, ({ age }) => age - 82) // -1
);
