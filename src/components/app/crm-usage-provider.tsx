'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import type { Json } from '@/lib/db/database.types';
import { createSupabaseBrowserClient } from '@/lib/db/browser';
import { isCrmUsageTrackingEnabled } from '@/lib/env';
import {
  insertUsageEvents,
  insertUsageEventsKeepAlive,
  type PendingUsageEvent,
} from '@/lib/usage/flush-usage-events-client';

const FLUSH_INTERVAL_MS = 30_000;
const MAX_PROPS_JSON = 4000;
const MAX_FLUSH_BATCHES = 20;

export type TrackFeatureFn = (
  name: string,
  properties?: Record<string, unknown>,
) => void;

const TrackFeatureContext = createContext<TrackFeatureFn>(() => {});

export function useTrackFeature(): TrackFeatureFn {
  return useContext(TrackFeatureContext);
}

function toJsonProps(raw?: Record<string, unknown>): Json {
  if (!raw || typeof raw !== 'object') return {};
  try {
    const s = JSON.stringify(raw);
    if (s.length > MAX_PROPS_JSON) return { _truncated: true };
    return JSON.parse(s) as Json;
  } catch {
    return {};
  }
}

export function CrmUsageProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const enabled = isCrmUsageTrackingEnabled();
  const queueRef = useRef<PendingUsageEvent[]>([]);
  const pathRef = useRef<string | null>(null);
  const visibleAccumMsRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);
  const supabaseRef = useRef(createSupabaseBrowserClient());

  const closeVisibleSegment = useCallback(() => {
    const start = segmentStartRef.current;
    if (start !== null) {
      visibleAccumMsRef.current += performance.now() - start;
      segmentStartRef.current = null;
    }
  }, []);

  const openVisibleSegment = useCallback(() => {
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible'
    ) {
      segmentStartRef.current = performance.now();
    }
  }, []);

  const flushBatches = useCallback(
    async (opts: { keepAlive: boolean }) => {
      const supabase = supabaseRef.current;
      let batches = 0;
      while (queueRef.current.length > 0 && batches < MAX_FLUSH_BATCHES) {
        const batch = queueRef.current.splice(0, 50);
        if (opts.keepAlive) {
          await insertUsageEventsKeepAlive(supabase, batch);
        } else {
          const ok = await insertUsageEvents(supabase, batch);
          if (!ok) {
            queueRef.current.unshift(...batch);
            break;
          }
        }
        batches += 1;
      }
    },
    [],
  );

  const trackFeature = useCallback<TrackFeatureFn>((name, properties) => {
    if (!enabled) return;
    const n = name.trim();
    if (!n) return;
    queueRef.current.push({
      category: 'feature',
      name: n,
      properties: toJsonProps(properties),
    });
    if (queueRef.current.length >= 80) {
      void flushBatches({ keepAlive: false });
    }
  }, [enabled, flushBatches]);

  useEffect(() => {
    if (!enabled) return;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        closeVisibleSegment();
      } else {
        openVisibleSegment();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [enabled, closeVisibleSegment, openVisibleSegment]);

  useEffect(() => {
    if (!enabled) return;

    const onPageHide = () => {
      closeVisibleSegment();
      const prev = pathRef.current;
      if (prev !== null) {
        const duration = Math.round(visibleAccumMsRef.current);
        if (duration > 0) {
          queueRef.current.push({
            category: 'screen',
            name: prev,
            duration_ms: duration,
            properties: {},
          });
        }
      }
      void flushBatches({ keepAlive: true });
    };

    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [enabled, closeVisibleSegment, flushBatches]);

  useEffect(() => {
    if (!enabled) return;

    const id = window.setInterval(() => {
      void flushBatches({ keepAlive: false });
    }, FLUSH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [enabled, flushBatches]);

  useEffect(() => {
    if (!enabled) return;

    closeVisibleSegment();

    const prev = pathRef.current;
    if (prev !== null) {
      const duration = Math.round(visibleAccumMsRef.current);
      if (duration > 0) {
        queueRef.current.push({
          category: 'screen',
          name: prev,
          duration_ms: duration,
          properties: {},
        });
      }
    }

    visibleAccumMsRef.current = 0;
    pathRef.current = pathname;
    openVisibleSegment();

    void flushBatches({ keepAlive: false });
  }, [
    pathname,
    enabled,
    closeVisibleSegment,
    openVisibleSegment,
    flushBatches,
  ]);

  return (
    <TrackFeatureContext.Provider value={enabled ? trackFeature : () => {}}>
      {children}
    </TrackFeatureContext.Provider>
  );
}
