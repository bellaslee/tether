import {
  computeRelationshipHearts,
  relationshipHeartBarTooltip,
} from '@/lib/people/relationship-warmth';
import {
  formatHeartsForAria,
  HeartSlot,
  heartLevelAtIndex,
} from '@/components/people/relationship-heart-icons';

type RelationshipHeartBarProps = {
  lastInteractionAt: string | null;
  metAt: string | null;
  createdAt: string;
  interactionCount: number;
  personCategoryName?: string | null;
  relationshipHeartsBaselineHalves?: number | null;
  now?: Date;
  className?: string;
  size?: 'default' | 'compact';
  /** When nested in a control that already has an accessible name (e.g. a button). */
  presentational?: boolean;
};

export function RelationshipHeartBar({
  lastInteractionAt,
  metAt,
  createdAt,
  interactionCount,
  personCategoryName = null,
  relationshipHeartsBaselineHalves = null,
  now,
  className = '',
  size = 'default',
  presentational = false,
}: RelationshipHeartBarProps) {
  const { filled, max } = computeRelationshipHearts({
    lastInteractionAt,
    metAt,
    createdAt,
    interactionCount,
    personCategoryName,
    relationshipHeartsBaselineHalves,
    now,
  });

  const ariaLabel = `Connection hearts: ${formatHeartsForAria(filled, max)}`;
  const title = relationshipHeartBarTooltip({
    lastInteractionAt,
    metAt,
    createdAt,
    interactionCount,
    personCategoryName,
    relationshipHeartsBaselineHalves,
    now,
  });

  const iconSize = size === 'compact' ? 14 : 18;
  const gap = size === 'compact' ? 'gap-px' : 'gap-0.5';

  return (
    <span
      role={presentational ? 'presentation' : 'img'}
      aria-label={presentational ? undefined : ariaLabel}
      aria-hidden={presentational ? true : undefined}
      title={presentational ? undefined : title}
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
