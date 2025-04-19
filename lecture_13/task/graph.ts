const GraphVis = require('graphviz-node');
const {spawn} = require('node:child_process');

type MatrixTypes =
	Uint8Array |
	Uint8ClampedArray |
	Int8Array |
	Uint16Array |
	Int16Array |
	Uint32Array |
	Int32Array |
	Float32Array |
	Float64Array |
	BigUint64Array |
	BigInt64Array;

type TypedArray<T> = new (capacity: number) => T;

type NumType<T extends MatrixTypes> = T extends BigUint64Array | BigInt64Array ? bigint : number;

class Matrix<T extends MatrixTypes> {
	readonly array: T;
	readonly TypedArray: TypedArray<T>;

	readonly cols: number;
	readonly rows: number;

	get buffer() {
		return this.array.buffer;
	}

	constructor(TypedArray: TypedArray<T>, cols: number, rows: number, data?: T) {
		this.TypedArray = TypedArray;

		this.cols = cols;
		this.rows = rows;

		this.array = new TypedArray(cols * rows);

		if (data != null) {
			this.array.set(<any>data);
		}
	}

	clone() {
		return new Matrix(this.TypedArray, this.cols, this.rows, this.array);
	}

	get(col: number, row: number): NumType<T> {
		const idx = this.getIndex(col, row);
		return this.array[idx] as any;
	}

	set(col: number, row: number, value: NumType<T>) {
		const idx = this.getIndex(col, row);
		this.array[idx] = value;
	}

	*byRows(): IterableIterator<[number, number, NumType<T>]> {
		for (let r = 0; r < this.rows; r++) {
			for (let c = 0; c < this.cols; c++) {
				yield [c, r, <any>this.array[this.getIndex(c, r)]];
			}
		}
	}

	*byCols(): IterableIterator<[number, number, NumType<T>]> {
		for (let c = 0; c < this.cols; c++) {
			for (let r = 0; r < this.rows; r++) {
				yield [c, r, <any>this.array[this.getIndex(c, r)]];
			}
		}
	}

	protected getIndex(col: number, row: number): number {
		return col + row * this.cols;
	}
}

interface Edge<T extends MatrixTypes> {
	from: number;
	to: number;
	weight: NumType<T>;
}

class Graph<T extends MatrixTypes> {
	readonly adjacencyMatrix: Matrix<T>;

	constructor(adjacencyMatrix: Matrix<T>) {
		this.adjacencyMatrix = adjacencyMatrix;
	}

	checkAdjacency(node1: number, node2: number): boolean {
		return this.adjacencyMatrix.get(node1, node2) != 0;
	}

	getEdgeWeight(node1: number, node2: number): NumType<T> {
		return this.adjacencyMatrix.get(node1, node2);
	}

	createEdge(node1: number, node2: number, weight: NumType<T>): void {
		this.createArc(node1, node2, weight);
		this.createArc(node2, node1, weight);
	}

	removeEdge(node1: number, node2: number): void {
		this.removeArc(node1, node2);
		this.removeArc(node2, node1);
	}

	createArc(node1: number, node2: number, weight: NumType<T>): void {
		this.adjacencyMatrix.set(node1, node2, weight);
	}

	removeArc(node1: number, node2: number): void {
		const {array} = this.adjacencyMatrix;

		const nil: NumType<T> = <any>(array instanceof BigUint64Array || array instanceof BigInt64Array ? 0n : 0);

		this.adjacencyMatrix.set(node1, node2, nil);
	}

	transitiveClosure() {
		const adjacencyMatrix = this.adjacencyMatrix.clone();

		const {array} = adjacencyMatrix;

		const yes: NumType<T> = <any>(array instanceof BigUint64Array || array instanceof BigInt64Array ? 1n : 1);

		const n = adjacencyMatrix.cols;

		for (let i = 0; i < n; i++) {
			if (adjacencyMatrix.get(i, i) > 0) {
				continue;
			}

			adjacencyMatrix.set(i, i, yes);
		}

		for (let k = 0; k < n; k++) {
			for (let c = 0; c < n; c++) {
				for (let r = 0; r < n; r++) {
					if (adjacencyMatrix.get(c, r) > 0) {
						continue;
					}

					if (adjacencyMatrix.get(c, k) && adjacencyMatrix.get(k, r)) {
						adjacencyMatrix.set(c, r, yes);
					}
				}
			}
		}

		return new Graph(adjacencyMatrix);
	}

	traverse(cb: (edge: Edge<T>) => void): void {
		for (const [c, r, weight] of this.adjacencyMatrix.byRows()) {
			if (weight == 0) {
				continue;
			}

			cb({
				from: c,
				to: r,
				weight
			});
		}
	}

	traverseFrom(startNode: number, cb: (edge: Edge<T>) => void): void {
		const that = this;

		const visitedNodes = new Set();

		function traverse(startNode: number): void {
			for (let i = 0; i < that.adjacencyMatrix.rows; i++) {
				const key = `${startNode}-${i}`;

				if (visitedNodes.has(key)) {
					continue;
				}

				if (that.checkAdjacency(startNode, i)) {
					visitedNodes.add(key);

					cb({
						from: startNode,
						to: i,
						weight: that.getEdgeWeight(startNode, i)
					});

					traverse(i);
				}
			}
		}

		traverse(startNode);
	}
}

const g = new GraphVis.Digraph('example');

const nodes = [
	['0', {'color': 'blue'}],
	['1', {'color': 'red'}],
	['2', {'color': 'yellow'}],
	['3', {'color': 'green'}],
	['4', {'color': 'magenta'}],
	['5', {'color': 'purple'}]
];

nodes.forEach((node) => {
	const n = g.addNode(...node);
	node.push(n);
});

const graph = new Graph(generateRandomAdjacencyMatrix(6));

graph.transitiveClosure().traverse(({from, to, weight}) => {
	g.addEdge(nodes[from].at(-1), nodes[to].at(-1), {label: String(weight)});
})

g.render('graph');
spawn('dot', ['-Tpng', 'graph.dot', '-o', './graph.png']);

function generateRandomAdjacencyMatrix(vertexCount: number, density: number = 0.4) {
	const m = new Matrix(Uint16Array, vertexCount, vertexCount);

	for (let i = 0; i < vertexCount; i++) {
		for (let j = i + 1; vertexCount > j; j++) {
			if (Math.random() < density) {
				m.set(i, j, getRandomInt(1, 10));

				if (Math.random() < density) {
					m.set(j, i, getRandomInt(1, 10));
				}
			}
		}
	}

	return m;

	function getRandomInt(min: number, max: number) {
		return Math.floor(Math.random() * (max - min + 1) + min);
	}
}
