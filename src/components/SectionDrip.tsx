type Props = { color: string; label?: string };

/** Gotas de "sorvete derretendo" na borda entre duas seções de cor diferente. */
export function SectionDrip({ color }: Props) {
  return (
    <svg
      className="bf-drip"
      viewBox="0 0 1200 60"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <g fill={color}>
        <path d="M0 30 C 60 30 70 60 120 60 C 170 60 176 26 232 26 C 290 26 300 60 356 60 C 410 60 420 22 480 22 C 540 22 548 60 604 60 C 660 60 668 28 726 28 C 784 28 792 60 848 60 C 906 60 914 24 972 24 C 1030 24 1040 60 1096 60 C 1150 60 1156 32 1200 32 L 1200 60 L 0 60 Z" />
        <circle cx="150" cy="52" r="7" />
        <circle cx="512" cy="55" r="6" />
        <circle cx="890" cy="53" r="7" />
      </g>
    </svg>
  );
}
