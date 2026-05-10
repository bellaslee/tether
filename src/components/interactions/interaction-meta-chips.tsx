import { formatInteractionTypeName } from '@/lib/domain/labels';

const CHIP_CLASS =
  'inline-flex shrink-0 items-center rounded-full border border-border-soft bg-surface-strong px-3 py-1 text-xs font-semibold text-foreground';

const UPCOMING_CHIP_CLASS =
  'inline-flex shrink-0 items-center rounded-full border border-accent/40 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent';

type Props = {
  typeName: string | null | undefined;
  showUpcoming?: boolean;
};

export function InteractionMetaChips({ typeName, showUpcoming }: Props) {
  return (
    <>
      {showUpcoming ? (
        <span className={UPCOMING_CHIP_CLASS}>Upcoming</span>
      ) : null}
      <span className={CHIP_CLASS}>
        {formatInteractionTypeName(typeName ?? 'Moment')}
      </span>
    </>
  );
}
