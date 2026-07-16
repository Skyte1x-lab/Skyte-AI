import { useId } from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  /** True while the assistant is thinking or actively listening — speeds up and brightens everything. */
  active?: boolean;
}

const NODE_COUNT = 30;
const NEIGHBORS_PER_NODE = 3;
const HUB_RADIUS = 14; // distance from center (50,50) below which a node is a bigger "hub" neuron

/** Small deterministic PRNG so the layout is stable across renders/reloads. */
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

function buildNodes(): [number, number][] {
  const rand = seededRandom(1337);
  const nodes: [number, number][] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = Math.sqrt(rand()) * 44;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius * 1.12;
    nodes.push([Math.max(4, Math.min(96, x)), Math.max(4, Math.min(96, y))]);
  }
  return nodes;
}

function buildEdges(nodes: [number, number][]): [number, number][] {
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  nodes.forEach((a, i) => {
    const nearest = nodes
      .map((b, j) => ({ j, d: i === j ? Infinity : Math.hypot(a[0] - b[0], a[1] - b[1]) }))
      .sort((p, q) => p.d - q.d)
      .slice(0, NEIGHBORS_PER_NODE);
    nearest.forEach(({ j }) => {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push(i < j ? [i, j] : [j, i]);
      }
    });
  });
  return edges;
}

const NODES = buildNodes();
const EDGES = buildEdges(NODES);
const HUBS = new Set(
  NODES.map((_, i) => i).filter((i) => Math.hypot(NODES[i][0] - 50, NODES[i][1] - 50) < HUB_RADIUS),
);

export default function SkyteOrb({ size = 'md', active = false }: Props) {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const filterId = `orb-glow-${rawId}`;

  return (
    <svg
      className={`skyte-orb ${size}${active ? ' active' : ''}`}
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <defs>
        <filter id={filterId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        {EDGES.map(([a, b], i) => {
          const [x1, y1] = NODES[a];
          const [x2, y2] = NODES[b];
          return (
            <line
              key={`e${i}`}
              className="orb-edge"
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              style={{ animationDelay: `${(i % 8) * 0.16}s` }}
            />
          );
        })}
        {EDGES.map(([a, b], i) => {
          const [x1, y1] = NODES[a];
          const [x2, y2] = NODES[b];
          const duration = 1.6 + (i % 6) * 0.26;
          const delay = (i * 0.47) % 3.6;
          return (
            <circle
              key={`s${i}`}
              className="orb-signal"
              r={1.4}
              style={{
                offsetPath: `path('M ${x1} ${y1} L ${x2} ${y2}')`,
                ['--signal-duration' as string]: `${duration}s`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
        {NODES.map(([x, y], i) => (
          <circle
            key={`n${i}`}
            className="orb-node"
            cx={x}
            cy={y}
            r={HUBS.has(i) ? 5 : 3}
            style={{ animationDelay: `${(i % 9) * 0.2}s` }}
          />
        ))}
      </g>
    </svg>
  );
}
