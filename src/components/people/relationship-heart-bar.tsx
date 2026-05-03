import { Heart } from 'lucide-react';
import {
  computeRelationshipHearts,
  relationshipHeartBarTooltip,
} from '@/lib/people/relationship-warmth';

type RelationshipHeartBarProps = {
  lastInteractionAt: string | null;
  metAt: string | null;
  createdAt: string;
  interactionCount: number;
  personCategoryName?: string | null;
  now?: Date;
  className?: string;
  size?: 'default' | 'compact';
};

function heartLevelAtIndex(
  index: number,
  /** Total filled (may include 0.5 steps). */
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

function formatHeartsForAria(filled: number, max: number): string {
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

function HeartSlot({
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

export function RelationshipHeartBar({
  lastInteractionAt,
  metAt,
  createdAt,
  interactionCount,
  personCategoryName = null,
  now,
  className = '',
  size = 'default',
}: RelationshipHeartBarProps) {
  const { filled, max } = computeRelationshipHearts({
    lastInteractionAt,
    metAt,
    createdAt,
    interactionCount,
    personCategoryName,
    now,
  });

  const ariaLabel = `Connection hearts: ${formatHeartsForAria(filled, max)}`;
  const title = relationshipHeartBarTooltip({
    lastInteractionAt,
    metAt,
    createdAt,
    interactionCount,
    personCategoryName,
    now,
  });

  const iconSize = size === 'compact' ? 14 : 18;
  const gap = size === 'compact' ? 'gap-px' : 'gap-0.5';

  return (
    <span
      role="img"
      aria-label={ariaLabel}
      title={title}
      className={`inline-flex shrink-0 items-center text-accent ${gap} ${className}`.trim()}
    >
      {Array.from({ length: max }, (_, i) => (
        <HeartSlot
          key={i}
          level={heartLevelAtIndex(i, filled)}
          iconSize={iconSize}
        />
      ))}
    </span>
  );
}
