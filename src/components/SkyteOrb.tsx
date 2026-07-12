interface Props {
  size?: 'sm' | 'md' | 'lg';
  listening?: boolean;
}

export default function SkyteOrb({ size = 'md', listening = false }: Props) {
  return (
    <span
      className={`skyte-orb ${size}${listening ? ' listening' : ''}`}
      aria-hidden="true"
    />
  );
}
