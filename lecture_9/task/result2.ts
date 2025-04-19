// enum StructureType {
//   U8 = 8,
// }

// class Structure {
//   static U8: Uint8Array;

//   buffer: ArrayBuffer;
//   map: Record<string, Uint8Array>;

//   constructor(schema: Record<string, Uint8ArrayConstructor>) {
//     const buf = new ArrayBuffer(3);

//     let offset = 0;

//     Object.keys(schema).forEach((key, index) => {
//       this[key] = new schema[key](buf, offset, 1);
//       offset += schema[key].BYTES_PER_ELEMENT
//     });
//   }
// }

// const Skills = new Structure({
//   singing: Structure.U8, // Unsigned число 8 бит
//   dancing: Structure.U8,
//   fighting: Structure.U8,
// });

// // Кортеж из 3-х чисел
// //   const Color = new Structure.Tuple(Structure.U8, Structure.U8, Structure.U8);

// const Person = new Structure({
//   firstName: Structure.String("ASCII"), // Строка в кодировке ASCII
//   lastName: Structure.String("ASCII"),
//   age: Structure.U(7), // Unsigned число 7 бит,
//   skills: Skills,
//   color: Color,
// });

// const bob = Person.create({
//   firstName: "Bob", // Тут придется сконвертировать UTF-16 в ASCII
//   lastName: "King",
//   age: 42,
//   skills: Skills.create({ singing: 100, dancing: 100, fighting: 50 }),
//   // color: Color.create(255, 0, 200)
// });

// //   console.log(bob.size); // Количество занимаемых байт конкретной структурой

// // "Свойства" структуры реализуются через геттеры/сеттеры.
// // Сама структура работает как View над данными в ArrayBuffer.

// //   console.log(bob.buffer);         // ArrayBuffer
// //   console.log(bob.firstName);      // Тут идет обратная конвертация в UTF-16 из ASCII
// //   console.log(bob.skills.singing); // 100

// //   const bobClone = Person.from(bob.buffer.slice());
