import {
  computeRelationshipWarmth,
  relationshipWarmthChipClassName,
  relationshipWarmthLabel,
  type RelationshipWarmth,
} from '@/lib/people/relationship-warmth';

type RelationshipWarmthChipProps = {
  lastInteractionAt: string | null;
  metAt: string | null;
  createdAt: string;
  now?: Date;
  className?: string;
  /** Tighter padding for dense rows (e.g. people list cards). */
  size?: 'default' | 'compact';
};

export function RelationshipWarmthChip({
  lastInteractionAt,
  metAt,
  createdAt,
  now,
  className = '',
  size = 'default',
}: RelationshipWarmthChipProps) {
  const warmth: RelationshipWarmth = computeRelationshipWarmth({
    lastInteractionAt,
    metAt,
    createdAt,
    now,
  });
  const sizeClass =
    size === 'compact' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs';
  return (
    <span
      className={`rounded-full font-semibold ${sizeClass} ${relationshipWarmthChipClassName(warmth)} ${className}`.trim()}
      title="Based on how long since you last interacted, adjusted for how long you have known them"
    >
      {relationshipWarmthLabel(warmth)}
    </span>
  );
}
