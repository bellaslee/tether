'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export type InteractionNotePreviewProps = {
  note: string;
  /** Stable id for this interaction (used in aria / DOM ids). */
  interactionId: string;
  className?: string;
};

export function InteractionNotePreview({
  note,
  interactionId,
  className = 'max-w-3xl',
}: InteractionNotePreviewProps) {
  const contentId = `interaction-note-${interactionId}`;
  const textRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [truncatable, setTruncatable] = useState(false);

  useLayoutEffect(() => {
    const el = textRef.current;
    if (!el) {
      return;
    }

    const measure = () => {
      if (expanded) {
        return;
      }
      const overflow = el.scrollHeight > el.clientHeight + 2;
      setTruncatable((prev) => prev || overflow);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [note, expanded]);

  return (
    <div className={className}>
      <p
        ref={textRef}
        id={contentId}
        className={
          expanded
            ? 'whitespace-pre-wrap text-sm leading-7 text-foreground/90 max-sm:leading-8 [overflow-wrap:anywhere]'
            : 'whitespace-pre-wrap text-sm leading-7 text-foreground/90 line-clamp-3 max-sm:leading-8 [overflow-wrap:anywhere]'
        }
      >
        {note}
      </p>
      {truncatable ? (
        <div className="mt-1.5">
          <Button
            type="button"
            variant="ghostSubtle"
            size="sm"
            className="h-auto min-h-0 px-0 py-0"
            aria-expanded={expanded}
            aria-controls={contentId}
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? 'Show less' : 'Read more'}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
