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
};

export function RelationshipWarmthChip({
  lastInteractionAt,
  metAt,
  createdAt,
  now,
  className = '',
}: RelationshipWarmthChipProps) {
  const warmth: RelationshipWarmth = computeRelationshipWarmth({
    lastInteractionAt,
    metAt,
    createdAt,
    now,
  });
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${relationshipWarmthChipClassName(warmth)} ${className}`.trim()}
      title="Based on how long since you last interacted, adjusted for how long you have known them"
    >
      {relationshipWarmthLabel(warmth)}
    </span>
  );
}
