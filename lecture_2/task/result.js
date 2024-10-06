const instructions = {
  "SET A": 0,
  "PRINT A": 1,
  "IFN A": 2,
  RET: 3,
  "DEC A": 4,
  JMP: 5,
};

function execute(program) {
  let A = 0;
  let pc = 0;

  while (pc < program.length) {
    switch (program[pc]) {
      case instructions["SET A"]:
        A = program[++pc];
        break;

      case instructions["PRINT A"]:
        console.log(A);
        pc++;
        break;

      case instructions["IFN A"]:
        if (A === 0) {
          pc++;
          break;
        }
        pc += 3;
        break;

      case instructions["RET"]:
        return A;

      case instructions["DEC A"]:
        A--;
        pc++;
        break;

      case instructions["JMP"]:
        pc = program[++pc];
        break;

      default:
        pc++;
    }
  }
}

const program = [
  // Ставим значения аккумулятора
  instructions["SET A"],
  // В 10
  10,

  // Выводим значение на экран
  instructions["PRINT A"],

  // Если A равно 0
  instructions["IFN A"],

  // Программа завершается
  instructions["RET"],

  // И возвращает 0
  0,

  // Уменьшаем A на 1
  instructions["DEC A"],

  // Устанавливаем курсор выполняемой инструкции
  instructions["JMP"],

  // В значение 2
  2,
];

// Выведет в консоль
// 10
// 9
// 8
// 7
// 6
// 5
// 4
// 3
// 2
// 1
// 0
// И вернет 0
console.log("return", execute(program));
