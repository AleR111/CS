interface StructureTypeAPI<T = unknown> {
  get(): T;
  set(value: T): void;
}

type StructureTypeDesc = number | StructureTypeAPI;

interface StructureType {
  (): number;
  (offset: number, buffer: ArrayBuffer): StructureTypeAPI;
}

class Structure {
  static U8(): number;
  static U8(offset: number, buffer: ArrayBuffer): StructureTypeAPI;
  static U8(offset?: number, buffer?: ArrayBuffer): StructureTypeDesc {
    if (offset == null || buffer == null) {
      return 1;
    }

    return {
      get(): number {
        return new Uint8Array(buffer, offset, 1)[0];
      },

      set(value: number) {
        const arr = new Uint8Array(buffer, offset, 1);
        arr[0] = value;
      },
    };
  }

  static U(bits: number): StructureType {
    const bytes = Math.ceil(bits / 8),
      mask = createMask(bits);

    if (bits > 32) {
      throw new RangeError("The number of bits cannot exceed 32");
    }

    return ((offset?: number, buffer?: ArrayBuffer): StructureTypeDesc => {
      if (offset == null || buffer == null) {
        return bytes;
      }

      return {
        get(): number {
          return new Uint32Array(buffer, offset, 1)[0] & mask;
        },

        set(value: number) {
          const arr = new Uint8Array(buffer, offset, bytes);

          for (let i = 0; i < bytes; i++) {
            arr[i] = (value >>> (i * 8)) & 0xff;
          }
        },
      };
    }) as any;

    function createMask(length: number) {
      return ~0 >>> (32 - length);
    }
  }

  static String(encoding: string, size: number): StructureType {
    encoding = encoding.toLowerCase();

    return ((offset?: number, buffer?: ArrayBuffer): StructureTypeDesc => {
      if (offset == null || buffer == null) {
        return size * encodingPerBytes();
      }

      return {
        get(): string {
          let str = "";

          switch (encoding) {
            case "ascii": {
              const arr = new Uint8Array(buffer, offset, size);

              for (const charCode of arr) {
                str += String.fromCharCode(charCode);
              }

              break;
            }
          }

          return str;
        },

        set(value: string) {
          switch (encoding) {
            case "ascii": {
              const arr = new Uint8Array(buffer, offset, size);

              for (let i = 0; i < size; i++) {
                arr[i] = value.charCodeAt(i);
              }

              break;
            }
          }
        },
      };
    }) as any;

    function encodingPerBytes() {
      switch (encoding) {
        case "ascii":
          return 1;
        default:
          return 2;
      }
    }
  }

  static Tuple(...values: (Structure | StructureType)[]): Structure {
    const struct = values.reduce((struct, type, i) => {
      struct[String(i)] = type;
      return struct;
    }, {} as Record<string, Structure | StructureType>);

    return new Structure(struct);
  }

  readonly size: number;
  readonly scheme: Record<string, StructureType>;

  create(
    data: Record<string, unknown> | unknown[],
    buffer: ArrayBuffer = new ArrayBuffer(this.size),
    offset: number = 0
  ): Record<string, any> {
    const { size } = this;

    const view = {
      get buffer() {
        return buffer;
      },

      get size() {
        return size;
      },
    };

    Object.entries(this.scheme).forEach(([key, type]) => {
      const { get, set } = type(offset, buffer);
      // @ts-ignore
      set(data[key] as any);

      Object.defineProperty(view, key, {
        enumerable: true,
        configurable: true,
        get,
        set,
      });

      offset += type();
    });

    return view;
  }

  from(buffer: ArrayBuffer, offset: number = 0): Record<string, any> {
    const view = {
      // FIXME добавить size

      get buffer() {
        return buffer;
      },
    };

    Object.entries(this.scheme).forEach(([key, type]) => {
      const { get, set } = type(offset, buffer);

      Object.defineProperty(view, key, {
        enumerable: true,
        configurable: true,
        get,
        set,
      });

      offset += type();
    });

    return view;
  }

  constructor(scheme: Record<string, Structure | StructureType>) {
    let schemeSize = 0;

    const normalizedScheme: Record<string, StructureType> = {};

    Object.entries(scheme).forEach(([key, type]) => {
      normalizedScheme[key] = type instanceof Structure ? type.toType() : type;
      schemeSize += normalizedScheme[key]();
    });

    this.size = schemeSize;
    this.scheme = normalizedScheme;
  }

  toType(): StructureType {
    return ((offset?: number, buffer?: ArrayBuffer): StructureTypeDesc => {
      if (offset == null || buffer == null) {
        return this.size;
      }

      let structure: Record<string, unknown> = this.from(buffer, offset);

      return {
        get: () => structure,
        set: (data: Record<string, unknown>) => {
          structure = this.create(data, buffer, offset);
        },
      };
    }) as any;
  }
}

const Color = Structure.Tuple(Structure.U8, Structure.U8, Structure.U8);

const Skills = new Structure({
  singing: Structure.U8,
  dancing: Structure.U8,
  fighting: Structure.U8,
});

const Person = new Structure({
  firstName: Structure.String("ASCII", 3),
  lastName: Structure.String("ASCII", 4),
  age: Structure.U(7),
  skills: Skills,
  color: Color,
});

const bob = Person.create({
  firstName: "Bob",
  lastName: "King",
  age: 42,
  skills: { singing: 100, dancing: 100, fighting: 50 },
  color: [255, 0, 200],
});

console.log(bob.buffer);

bob.skills.singing = 50;
bob.firstName = "Ben";

console.log(bob.buffer);
console.log(bob.firstName);
console.log(bob.skills.singing);

const bobClone = Person.from(bob.buffer.slice());

console.log(bobClone.lastName);
