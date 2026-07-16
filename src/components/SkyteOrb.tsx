import { useId } from 'react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  /** True while the assistant is thinking or actively listening — speeds up and brightens the pulse. */
  active?: boolean;
}

// A small organic neuron cluster: [x, y] positions in a 0-100 viewBox.
const NODES: [number, number][] = [
  [50, 12],
  [26, 28],
  [74, 28],
  [14, 54],
  [50, 48],
  [86, 54],
  [30, 78],
  [70, 78],
  [50, 94],
];

// Synapses connecting nearby neurons.
const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 2],
  [1, 3],
  [2, 5],
  [1, 4],
  [2, 4],
  [3, 4],
  [4, 5],
  [3, 6],
  [4, 6],
  [4, 7],
  [5, 7],
  [6, 7],
  [6, 8],
  [7, 8],
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
        <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
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
        {NODES.map(([x, y], i) => (
          <circle
            key={`n${i}`}
            className="orb-node"
            cx={x}
            cy={y}
            r={i === 4 ? 5.5 : 4}
            style={{ animationDelay: `${(i % 9) * 0.22}s` }}
          />
        ))}
      </g>
    </svg>
  );
}
