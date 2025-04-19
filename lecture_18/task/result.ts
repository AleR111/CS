// ## Необходимо написать регулярное выражение

// Которое при вызове test на строке будет давать false, если в строке есть символы отличные от латинских, цифр, подчеркивания и знака $.

const myRegExp = /^[\w$]+$/;
console.log("🚀 ~ myRegExp:", myRegExp.test("привет")); // false

// ## Необходимо создать массив на основе строки

// Элементы в строке разделены сепараторами `;` и `,`. Необходимо возвращать первый числовой элемент `;` последовательности.

const myRegExp2 = /,[\d,]+;/;
console.log(
  "762120,0,22;763827,0,50;750842,0,36;749909,0,95;755884,0,41;".split(
    myRegExp2
  )
); // ['762120', '763827', '750842', '749909', '755884']

// ## Итератор на основе строки

// Необходимо создать итератор на основе исходной строки.

// [['"a": 1', 'a', '1'], ['"b": "2"', 'b', '"2"']]
const myRegExp3 = /("(\w)": ("?\d+"?))/g;
console.log([...'{"a": 1, "b": "2"}'.matchAll(myRegExp3)]);

// ## Необходимо написать функцию, которая принимает строковый шаблон и объект параметров, и возвращает результат применения данных к этому шаблону

// Hello, Bob! Your age is 10.
const res = format("Hello, ${user}! Your age is ${age}.", {
  user: "Bob",
  age: 10,
});

function format(str: string, obj: { [key: string]: any }) {
  const result = str.replace(/\$\{(\w+)}/g, (_, key) => {
    return obj[key];
  });
  console.log("🚀 ~ result ~ result:", result);
}

// ## Нахождение арифметических операций в строке и замена на результат

calc(`
Какой-то текст (10 + 15 - 24) ** 2
Еще какой (то) текст 2 * 10
`) ==
  `
Какой-то текст 1
Еще какой-то текст 20
`;

function calc(str: string) {
  const result = str.replace(/[\(\)\+\*\:\-\d ]+/g, (expression) => {
    let start = "";
    let end = "";
    if (expression === " ") return " ";
    if (expression.startsWith(" ")) start = " ";
    if (expression.endsWith(" ")) end = " ";
    try {
      const result = new Function(`return ${expression}`)();
      return start + result + end;
    } catch (error) {
      return expression;
    }
  });
  console.log("🚀 ~ result ~ result:", result);

  return result;
}
