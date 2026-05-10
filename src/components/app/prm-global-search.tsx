'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { FormInput } from '@/components/ui/form-input';

export type PrmSearchHit = {
  kind: 'person' | 'interaction';
  id: string;
  label: string;
  subtitle: string | null;
};

type PrmGlobalSearchContextValue = {
  openSearch: () => void;
  /** Assigns the header trigger element for focus return (callback ref, not a ref object). */
  setTriggerElement: (el: HTMLButtonElement | null) => void;
};

const PrmGlobalSearchContext = createContext<PrmGlobalSearchContextValue | null>(
  null,
);

function useMacLikeModifierHint(): string {
  return useMemo(() => {
    if (typeof navigator === 'undefined') {
      return '⌘K';
    }
    return /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent) ? '⌘K' : 'Ctrl K';
  }, []);
}

/** Next.js client navigations may not scroll to hash; retry until the row mounts. */
function scrollToTimelineInteractionDom(interactionId: string) {
  const domId = `interaction-${interactionId}`;
  let attempts = 0;
  const tick = () => {
    document.getElementById(domId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    attempts += 1;
    if (attempts < 40 && !document.getElementById(domId)) {
      requestAnimationFrame(tick);
    }
  };
  requestAnimationFrame(tick);
}

export function PrmGlobalSearchTrigger({ className = '' }: { className?: string }) {
  const ctx = useContext(PrmGlobalSearchContext);
  const modHint = useMacLikeModifierHint();
  if (!ctx) {
    throw new Error('PrmGlobalSearchProvider is required');
  }
  return (
    <button
      // eslint-disable-next-line react-hooks/refs -- stable callback ref from context (not reading ref.current during render)
      ref={ctx.setTriggerElement}
      type="button"
      onClick={() => ctx.openSearch()}
      className={
        `flex min-w-0 items-center gap-2 rounded-2xl border border-border-soft bg-surface px-3 py-2 text-left text-sm text-muted shadow-none transition hover:bg-surface-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ` +
        className
      }
      aria-haspopup="dialog"
    >
      <Search className="size-4 shrink-0 opacity-70" aria-hidden />
      <span className="min-w-0 flex-1 truncate">Search people &amp; timeline…</span>
      <kbd
        suppressHydrationWarning
        className="hidden shrink-0 rounded-md border border-border-soft bg-surface-strong px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold text-muted sm:inline"
      >
        {modHint}
      </kbd>
    </button>
  );
}

export function PrmGlobalSearchProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const dialogTitleId = useId();
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const setTriggerElement = useCallback((el: HTMLButtonElement | null) => {
    triggerRef.current = el;
  }, []);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [hits, setHits] = useState<PrmSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const resetSearchState = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setHits([]);
    setFetchError(null);
    setSelectedIndex(0);
    setLoading(false);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    resetSearchState();
    queueMicrotask(() => triggerRef.current?.focus());
  }, [resetSearchState]);

  const openSearch = useCallback(() => {
    setOpen(true);
    setFetchError(null);
    queueMicrotask(() => inputRef.current?.focus());
  }, []);

  const ctxValue = useMemo(
    () => ({ openSearch, setTriggerElement }),
    [openSearch, setTriggerElement],
  );

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const q = debouncedQuery.trim();
    if (!q) {
      setHits([]);
      setLoading(false);
      setFetchError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    void (async () => {
      try {
        const res = await fetch(
          `/api/prm/search?q=${encodeURIComponent(q)}`,
          { method: 'GET' },
        );
        const data: unknown = await res.json();
        if (cancelled) {
          return;
        }
        if (!res.ok) {
          const err =
            typeof data === 'object' &&
            data !== null &&
            'error' in data &&
            typeof (data as { error: unknown }).error === 'string'
              ? (data as { error: string }).error
              : 'Search failed';
          setFetchError(err);
          setHits([]);
          return;
        }
        const results =
          typeof data === 'object' &&
          data !== null &&
          'results' in data &&
          Array.isArray((data as { results: unknown }).results)
            ? (data as { results: PrmSearchHit[] }).results
            : [];
        setHits(results);
      } catch {
        if (!cancelled) {
          setFetchError('Could not reach search');
          setHits([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, debouncedQuery]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [hits]);

  useEffect(() => {
    const onDocKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((was) => {
          if (was) {
            resetSearchState();
            queueMicrotask(() => {
              triggerRef.current?.focus();
            });
            return false;
          }
          setFetchError(null);
          queueMicrotask(() => inputRef.current?.focus());
          return true;
        });
      }
    };
    document.addEventListener('keydown', onDocKey, true);
    return () => document.removeEventListener('keydown', onDocKey, true);
  }, [resetSearchState]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  const go = useCallback(
    (hit: PrmSearchHit) => {
      close();
      if (hit.kind === 'person') {
        router.push(`/people/${hit.id}`);
      } else {
        router.push(`/timeline#interaction-${hit.id}`);
        scrollToTimelineInteractionDom(hit.id);
      }
    },
    [close, router],
  );

  const onDialogKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) =>
        hits.length === 0 ? 0 : Math.min(i + 1, hits.length - 1),
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (hits.length === 0 ? 0 : Math.max(i - 1, 0)));
    } else if (e.key === 'Enter') {
      if (hits.length === 0 || e.nativeEvent.isComposing) {
        return;
      }
      e.preventDefault();
      const hit = hits[selectedIndex];
      if (hit) {
        go(hit);
      }
    }
  };

  const modal =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="prm-search-modal-overlay fixed inset-0 z-[200] flex items-start justify-center bg-foreground/35 backdrop-blur-[2px]"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                close();
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={dialogTitleId}
              className="card-surface flex max-h-[min(72dvh,28rem)] w-full max-w-lg flex-col overflow-hidden rounded-[1.75rem] border border-border-soft shadow-lg"
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDownCapture={onDialogKeyDown}
            >
              <div className="border-b border-border-soft px-4 py-3 sm:px-5">
                <p id={dialogTitleId} className="sr-only">
                  Search people and timeline
                </p>
                <div className="flex items-center gap-2">
                  <Search className="size-5 shrink-0 text-muted" aria-hidden />
                  <FormInput
                    ref={inputRef}
                    type="search"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Search…"
                    aria-controls={listboxId}
                    aria-activedescendant={
                      hits.length > 0
                        ? `${listboxId}-option-${selectedIndex}`
                        : undefined
                    }
                    value={query}
                    onChange={(ev) => setQuery(ev.target.value)}
                    fieldSize="default"
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 sm:px-3">
                {fetchError ? (
                  <p className="px-2 py-6 text-center text-sm text-red-700">
                    {fetchError}
                  </p>
                ) : null}
                {!fetchError && loading ? (
                  <p className="px-2 py-6 text-center text-sm text-muted">
                    Searching…
                  </p>
                ) : null}
                {!fetchError &&
                !loading &&
                debouncedQuery.trim().length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-muted">
                    Type to find people and timeline moments.
                  </p>
                ) : null}
                {!fetchError &&
                !loading &&
                debouncedQuery.trim().length > 0 &&
                hits.length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-muted">
                    No matches yet.
                  </p>
                ) : null}
                {hits.length > 0 ? (
                  <ul
                    id={listboxId}
                    role="listbox"
                    aria-label="Search results"
                    className="space-y-1"
                  >
                    {hits.map((hit, index) => {
                      const kindLabel =
                        hit.kind === 'person' ? 'Person' : 'Timeline';
                      const selected = index === selectedIndex;
                      return (
                        <li key={`${hit.kind}-${hit.id}`} role="presentation">
                          <button
                            type="button"
                            role="option"
                            id={`${listboxId}-option-${index}`}
                            aria-selected={selected}
                            className={
                              `flex w-full flex-col gap-0.5 rounded-2xl px-3 py-2.5 text-left transition ` +
                              (selected
                                ? 'bg-accent-soft text-foreground'
                                : 'hover:bg-surface-strong')
                            }
                            onMouseEnter={() => setSelectedIndex(index)}
                            onClick={() => go(hit)}
                          >
                            <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted">
                              {kindLabel}
                            </span>
                            <span className="font-medium [overflow-wrap:anywhere]">
                              {hit.label}
                            </span>
                            {hit.subtitle ? (
                              <span className="text-xs leading-snug text-muted [overflow-wrap:anywhere]">
                                {hit.subtitle}
                              </span>
                            ) : null}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-soft px-4 py-2 text-[0.65rem] text-muted sm:px-5">
                <span>
                  <kbd className="rounded border border-border-soft bg-surface-strong px-1 font-mono">
                    ↑
                  </kbd>{' '}
                  <kbd className="rounded border border-border-soft bg-surface-strong px-1 font-mono">
                    ↓
                  </kbd>{' '}
                  move ·{' '}
                  <kbd className="rounded border border-border-soft bg-surface-strong px-1 font-mono">
                    Enter
                  </kbd>{' '}
                  open ·{' '}
                  <kbd className="rounded border border-border-soft bg-surface-strong px-1 font-mono">
                    Esc
                  </kbd>{' '}
                  close
                </span>
                <Button
                  type="button"
                  variant="ghostSubtle"
                  size="sm"
                  onClick={close}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <PrmGlobalSearchContext.Provider value={ctxValue}>
      {children}
      {modal}
    </PrmGlobalSearchContext.Provider>
  );
}
