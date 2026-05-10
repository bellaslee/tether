'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { syncBrowserTimezoneIfUnsetAction } from '@/lib/actions/profile';

/**
 * Profile settings show the browser zone when auth metadata has no saved zone, but
 * server-rendered pages (timeline, etc.) read only metadata and fall back to UTC.
 * Persist the browser zone once so both paths agree.
 */
export function AccountTimezoneBootstrap({ needsSync }: { needsSync: boolean }) {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (!needsSync || ran.current) {
      return;
    }
    ran.current = true;

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fd = new FormData();
    fd.set('timezone', tz);

    void (async () => {
      const result = await syncBrowserTimezoneIfUnsetAction(fd);
      if (result.synced) {
        router.refresh();
      }
    })();
  }, [needsSync, router]);

  return null;
}
