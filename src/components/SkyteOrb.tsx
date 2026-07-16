import { useId } from 'react';
import { generateNetwork } from '../lib/neuralNetwork';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  /** True while the assistant is thinking or actively listening — speeds up and brightens everything. */
  active?: boolean;
}

const { nodes: NODES, edges: EDGES, hubs: HUBS } = generateNetwork({
  nodeCount: 30,
  neighborsPerNode: 3,
  width: 100,
  height: 100,
  seed: 1337,
});

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
