import { useId } from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  /** True while the assistant is thinking or actively listening — speeds up and brightens everything. */
  active?: boolean;
}

// An organic neuron cluster: [x, y] positions in a 0-100 viewBox.
const NODES: [number, number][] = [
  [50, 8],
  [28, 20],
  [72, 20],
  [12, 40],
  [50, 32],
  [88, 40],
  [24, 55],
  [50, 52],
  [76, 55],
  [14, 72],
  [50, 74],
  [86, 72],
  [50, 95],
];

// Bigger "hub" neurons read better at large scale.
const HUB_NODES = new Set([4, 7, 10]);

// Synapses connecting nearby neurons.
const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
  [1, 3],
  [1, 4],
  [2, 4],
  [2, 5],
  [3, 4],
  [3, 6],
  [4, 5],
  [4, 7],
  [5, 8],
  [6, 7],
  [6, 9],
  [6, 10],
  [7, 8],
  [7, 10],
  [7, 11],
  [8, 11],
  [9, 10],
  [9, 12],
  [10, 11],
  [10, 12],
  [11, 12],
];

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
          <feGaussianBlur stdDeviation="2.6" result="blur" />
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
              style={{ animationDelay: `${(i % 8) * 0.18}s` }}
            />
          );
        })}
        {EDGES.map(([a, b], i) => {
          const [x1, y1] = NODES[a];
          const [x2, y2] = NODES[b];
          const duration = 1.8 + (i % 5) * 0.3;
          const delay = (i * 0.55) % 3.2;
          return (
            <circle
              key={`s${i}`}
              className="orb-signal"
              r={1.6}
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
            r={HUB_NODES.has(i) ? 5.5 : 3.4}
            style={{ animationDelay: `${(i % 9) * 0.22}s` }}
          />
        ))}
      </g>
    </svg>
  );
}
