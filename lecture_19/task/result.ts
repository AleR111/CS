// ## Необходимо написать функцию, которая бы принимала бы строку и "схлопывала" бы все подряд идущие повторения

function zipStr(str: string) {
  return str.replace(/(.)\1+/g, "$1").replace(/(.+)\1+/g, "$1");
}

console.log(zipStr("abbaabbafffbezza")); // abafbeza

// ## Необходимо написать функцию, которая бы удаляла из строки все не уникальные символы

function unique(str: string) {
  let res = str;
  let old;

  do {
    old = res;
    console.log("🚀 ~ unique ~ old:", old)
    res = res.replace(/(.).*\1+/g, (match, $1) => {
      return match.replaceAll($1, "");
    });
  } while (res.length !== old.length);

  return res;
}

console.log(unique("abaceffagw")); // bcegw

// ## Необходимо написать функцию, которая бы находила в строке любые числа обозначающие деньги

function findMoney(str: string) {
  const moneySymbols = "$₽";

  const regExp = new RegExp(String.raw`\d[\d ,.]*[${moneySymbols}]`, "g");

  return str.match(regExp);
}

// // ['100 00,53$', '500₽']
console.log(
  findMoney(
    `20.10.2020 Федор взял у меня 100 00,53$ и обещался вернуть не поздее 25 числа, но уже через 2 дня, он занял еще 500₽`
  )
);
