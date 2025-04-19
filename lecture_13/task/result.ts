import { Matrix, MatrixTypes } from "../../lecture_8/task/matrix";

class Graph<T extends MatrixTypes> {
  matrix: Matrix<T>;

  constructor(matrix: Matrix<T>) {
    this.matrix = matrix;
  }

  checkAdjacency(node1: number, node2: number) {
    const forward = this.matrix.get(node1, node2);
    const backward = this.matrix.get(node2, node1);

    return [forward, backward, forward && backward];
  }

  createEdge(
    node1: number,
    node2: number,
    weight: T extends BigUint64Array | BigInt64Array ? bigint : number
  ) {
    const defaultWeight = this.isBigIntMatrix() ? 1n : 1;
    this.matrix.set(node1, node2, weight ?? defaultWeight);
    this.matrix.set(node2, node1, weight ?? defaultWeight);
  }

  removeEdge(node1: number, node2: number) {
    const zero = (this.isBigIntMatrix() ? 0n : 0) as T extends
      | BigUint64Array
      | BigInt64Array
      ? bigint
      : number;
    this.matrix.set(node1, node2, zero);
    this.matrix.set(node2, node1, zero);
  }

  createArc(
    node1: number,
    node2: number,
    weight: T extends BigUint64Array | BigInt64Array ? bigint : number
  ) {
    const defaultWeight = this.isBigIntMatrix() ? 1n : 1;
    this.matrix.set(node1, node2, weight ?? defaultWeight);
  }

  removeArc(node1: number, node2: number) {
    const zero = (this.isBigIntMatrix() ? 0n : 0) as T extends
      | BigUint64Array
      | BigInt64Array
      ? bigint
      : number;
    this.matrix.set(node1, node2, zero);
  }

  private isBigIntMatrix(): boolean {
    return (
      this.matrix instanceof BigUint64Array ||
      this.matrix instanceof BigInt64Array
    );
  }
}

const adjacencyMatrix = new Matrix(Uint8Array, 3, 3);

adjacencyMatrix.set(0, 0, 0);
adjacencyMatrix.set(0, 1, 2);
adjacencyMatrix.set(0, 2, 0);

adjacencyMatrix.set(1, 0, 0);
adjacencyMatrix.set(1, 1, 0);
adjacencyMatrix.set(1, 2, 0);

adjacencyMatrix.set(2, 0, 0);
adjacencyMatrix.set(2, 1, 5);
adjacencyMatrix.set(2, 2, 0);

const graph = new Graph(adjacencyMatrix);

// Проверяем смежность двух узлов графа (с учетом направленности)

console.log("🚀 ~ graph:", graph.checkAdjacency(0, 1));

// Добавляет ребро между двумя узлами и, опционально, вес.
// Если дуга уже есть, то просто меняется вес (если она задан).
graph.createEdge(2, 0, 3);
console.log("🚀 ~ graph:", graph.checkAdjacency(2, 0));

graph.removeEdge(2, 0);
console.log("🚀 ~ graph:", graph.checkAdjacency(2, 0));

// // Добавляет дугу между двумя узлами и, опционально, вес
graph.createArc(2, 0, 3);
console.log("🚀 ~ graph:", graph.checkAdjacency(2, 0));

graph.removeArc(2, 0);
console.log("🚀 ~ graph:", graph.checkAdjacency(2, 0));
