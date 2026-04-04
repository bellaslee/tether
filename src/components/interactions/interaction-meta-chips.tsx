import type { InteractionDirection } from '@/lib/db/database.types';
import {
  formatInteractionDirection,
  formatInteractionTypeName,
} from '@/lib/domain/labels';

const CHIP_CLASS =
  'inline-flex shrink-0 items-center rounded-full border border-border-soft bg-white px-3 py-1 text-xs font-semibold text-foreground';

type Props = {
  typeName: string | null | undefined;
  direction: InteractionDirection | null | undefined;
};

export function InteractionMetaChips({ typeName, direction }: Props) {
  return (
    <>
      <span className={CHIP_CLASS}>
        {formatInteractionTypeName(typeName ?? 'Moment')}
      </span>
      {direction ? (
        <span className={CHIP_CLASS}>
          {formatInteractionDirection(direction)}
        </span>
      ) : null}
    </>
  );
}
