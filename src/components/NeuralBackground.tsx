import { useEffect, useRef, useState } from 'react';
import { generateNetwork } from '../lib/neuralNetwork';

interface Props {
  /** True while the assistant is thinking or actively listening — sustained faster/brighter pulse. */
  active?: boolean;
  /** Bump this (e.g. pass chatHistory.length) to trigger a brief bright "burst" reaction. */
  messageCount: number;
}

const VIEW_WIDTH = 200;
const VIEW_HEIGHT = 100;

const { nodes: NODES, edges: EDGES, hubs: HUBS } = generateNetwork({
  nodeCount: 46,
  neighborsPerNode: 3,
  width: VIEW_WIDTH,
  height: VIEW_HEIGHT,
  seed: 2024,
});

export default function NeuralBackground({ active = false, messageCount }: Props) {
  const [burst, setBurst] = useState(false);
  const prevCount = useRef(messageCount);

  useEffect(() => {
    if (messageCount > prevCount.current) {
      setBurst(true);
      const timeout = setTimeout(() => setBurst(false), 900);
      prevCount.current = messageCount;
      return () => clearTimeout(timeout);
    }
    prevCount.current = messageCount;
  }, [messageCount]);

  return (
    <div className="neural-bg" aria-hidden="true">
      <svg
        className={`neural-bg-svg${active ? ' active' : ''}${burst ? ' burst' : ''}`}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
      >
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
          const delay = (i * 0.37) % 3.6;
          return (
            <circle
              key={`s${i}`}
              className="orb-signal"
              r={1.3}
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
            r={HUBS.has(i) ? 3.2 : 1.9}
            style={{ animationDelay: `${(i % 9) * 0.2}s` }}
          />
        ))}
      </svg>
    </div>
  );
}
