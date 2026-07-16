export interface NeuralNetwork {
  nodes: [number, number][];
  edges: [number, number][];
  hubs: Set<number>;
}

/** Small deterministic PRNG so layouts are stable across renders/reloads. */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface GenerateOptions {
  nodeCount: number;
  neighborsPerNode: number;
  width: number;
  height: number;
  seed: number;
  hubFraction?: number;
}

/** Generates an organic neuron cluster (elliptical scatter + k-nearest-neighbor synapses). */
export function generateNetwork({
  nodeCount,
  neighborsPerNode,
  width,
  height,
  seed,
  hubFraction = 0.14,
}: GenerateOptions): NeuralNetwork {
  const rand = seededRandom(seed);
  const cx = width / 2;
  const cy = height / 2;

  const nodes: [number, number][] = [];
  for (let i = 0; i < nodeCount; i++) {
    const angle = rand() * Math.PI * 2;
    const r = Math.sqrt(rand());
    const x = cx + Math.cos(angle) * r * cx * 0.96;
    const y = cy + Math.sin(angle) * r * cy * 0.96;
    nodes.push([x, y]);
  }

  const seen = new Set<string>();
  const edges: [number, number][] = [];
  nodes.forEach((a, i) => {
    const nearest = nodes
      .map((b, j) => ({ j, d: i === j ? Infinity : Math.hypot(a[0] - b[0], a[1] - b[1]) }))
      .sort((p, q) => p.d - q.d)
      .slice(0, neighborsPerNode);
    nearest.forEach(({ j }) => {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push(i < j ? [i, j] : [j, i]);
      }
    });
  });

  const hubRadius = Math.min(width, height) * hubFraction;
  const hubs = new Set(
    nodes.map((_, i) => i).filter((i) => Math.hypot(nodes[i][0] - cx, nodes[i][1] - cy) < hubRadius),
  );

  return { nodes, edges, hubs };
}
