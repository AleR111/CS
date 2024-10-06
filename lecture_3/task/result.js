const fizzbuzz = () => {
  for (let i = 1n; i <= 100n; i += 1n) {
    if (i % 15n === 0n) {
      console.log("FizzBuzz");
    } else if (i % 3n === 0n) {
      console.log("Fizz");
    } else if (i % 5n === 0n) {
      console.log("Buzz");
    } else {
      console.log(i);
    }
  }
};

fizzbuzz();
