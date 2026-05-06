import { Heart } from 'lucide-react';

export function heartLevelAtIndex(
  index: number,
  filled: number,
): 'full' | 'half' | 'empty' {
  if (filled >= index + 1) {
    return 'full';
  }
  if (filled >= index + 0.5) {
    return 'half';
  }
  return 'empty';
}

export function formatHeartsForAria(filled: number, max: number): string {
  const whole = Math.floor(filled);
  const frac = filled - whole;
  if (frac >= 0.4 && frac <= 0.6) {
    return `${whole} and a half of ${max}`;
  }
  if (Number.isInteger(filled)) {
    return `${filled} of ${max}`;
  }
  return `${filled} of ${max}`;
}

export function HeartSlot({
  level,
  iconSize,
}: {
  level: 'full' | 'half' | 'empty';
  iconSize: number;
}) {
  if (level === 'full') {
    return (
      <Heart
        size={iconSize}
        aria-hidden
        className="fill-current stroke-current"
        strokeWidth={2}
      />
    );
  }
  if (level === 'empty') {
    return (
      <Heart
        size={iconSize}
        aria-hidden
        className="fill-transparent stroke-current opacity-55"
        strokeWidth={1.75}
      />
    );
  }

  return (
    <span
      className="relative inline-flex shrink-0"
      style={{ width: iconSize, height: iconSize }}
    >
      <Heart
        size={iconSize}
        aria-hidden
        className="pointer-events-none absolute inset-0 fill-transparent stroke-current opacity-55"
        strokeWidth={1.75}
      />
      <span className="absolute inset-y-0 left-0 flex w-1/2 justify-start overflow-hidden">
        <Heart
          size={iconSize}
          aria-hidden
          className="shrink-0 fill-current stroke-current"
          strokeWidth={2}
        />
      </span>
    </span>
  );
}
