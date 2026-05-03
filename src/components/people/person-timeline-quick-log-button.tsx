'use client';

import { Button } from '@/components/ui/button';
import { usePersonQuickLog } from '@/components/people/person-quick-log-context';

/** Opens the shared Quick Log calendar dialog (same as the header control). */
export function PersonTimelineQuickLogButton() {
  const { openQuickLog } = usePersonQuickLog();

  return (
    <Button
      type="button"
      variant="ghostSubtle"
      size="chip"
      onClick={openQuickLog}
      aria-haspopup="dialog"
    >
      Quick Log
    </Button>
  );
}
