'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';

export type PersonDetailTab = 'overview' | 'details';

type TabsContextValue = {
  tab: PersonDetailTab;
  setTab: (tab: PersonDetailTab) => void;
  personId: string;
};

const PersonDetailTabsContext = createContext<TabsContextValue | null>(null);

export function usePersonDetailTabs() {
  const ctx = useContext(PersonDetailTabsContext);
  if (!ctx) {
    throw new Error(
      'usePersonDetailTabs must be used within PersonDetailTabsProvider',
    );
  }
  return ctx;
}

export function PersonDetailTabsProvider({
  personId,
  initialTab,
  children,
}: {
  personId: string;
  initialTab: PersonDetailTab;
  children: ReactNode;
}) {
  const [tab, setTabState] = useState<PersonDetailTab>(initialTab);
  const pathname = usePathname();

  useEffect(() => {
    const readTabFromLocation = (): PersonDetailTab => {
      const params = new URLSearchParams(window.location.search);
      return params.get('tab') === 'details' ? 'details' : 'overview';
    };

    const onPopState = () => {
      setTabState(readTabFromLocation());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const setTab = useCallback(
    (next: PersonDetailTab) => {
      setTabState(next);
      const pathOnly =
        (pathname?.split('?')[0] ?? `/people/${personId}`) || `/people/${personId}`;
      const url =
        next === 'details' ? `${pathOnly}?tab=details` : pathOnly;
      window.history.replaceState(null, '', url);
    },
    [pathname, personId],
  );

  const value = useMemo(
    () => ({ tab, setTab, personId }),
    [tab, setTab, personId],
  );

  return (
    <PersonDetailTabsContext.Provider value={value}>
      {children}
    </PersonDetailTabsContext.Provider>
  );
}

const tabLinkBase =
  'inline-flex border-b-2 px-1 pb-3 text-sm font-semibold transition sm:text-base';
const tabLinkActive = `${tabLinkBase} border-accent text-foreground`;
const tabLinkInactive = `${tabLinkBase} border-transparent text-muted hover:text-foreground/80`;

export function PersonDetailTabNav({
  profileSectionsAria,
  tabOverview,
  tabDetails,
}: {
  profileSectionsAria: string;
  tabOverview: string;
  tabDetails: string;
}) {
  const { tab, setTab } = usePersonDetailTabs();
  const overviewRef = useRef<HTMLButtonElement>(null);
  const detailsRef = useRef<HTMLButtonElement>(null);

  const onOverviewKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setTab('details');
      queueMicrotask(() => detailsRef.current?.focus());
    }
  };

  const onDetailsKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setTab('overview');
      queueMicrotask(() => overviewRef.current?.focus());
    }
  };

  return (
    <nav
      role="tablist"
      aria-label={profileSectionsAria}
      className="flex w-full flex-wrap gap-x-8 gap-y-3"
    >
      <button
        ref={overviewRef}
        type="button"
        role="tab"
        id="person-detail-tab-overview"
        aria-selected={tab === 'overview'}
        aria-controls="person-detail-panel-overview"
        tabIndex={tab === 'overview' ? 0 : -1}
        className={tab === 'overview' ? tabLinkActive : tabLinkInactive}
        onClick={() => setTab('overview')}
        onKeyDown={onOverviewKeyDown}
      >
        {tabOverview}
      </button>
      <button
        ref={detailsRef}
        type="button"
        role="tab"
        id="person-detail-tab-details"
        aria-selected={tab === 'details'}
        aria-controls="person-detail-panel-details"
        tabIndex={tab === 'details' ? 0 : -1}
        className={tab === 'details' ? tabLinkActive : tabLinkInactive}
        onClick={() => setTab('details')}
        onKeyDown={onDetailsKeyDown}
      >
        {tabDetails}
      </button>
    </nav>
  );
}

export function PersonDetailTabPanels({
  overview,
  details,
}: {
  overview: ReactNode;
  details: ReactNode;
}) {
  const { tab } = usePersonDetailTabs();
  const overviewHidden = tab !== 'overview';
  const detailsHidden = tab !== 'details';

  return (
    <>
      <div
        id="person-detail-panel-overview"
        role="tabpanel"
        aria-labelledby="person-detail-tab-overview"
        hidden={overviewHidden}
        aria-hidden={overviewHidden}
      >
        {overview}
      </div>
      <div
        id="person-detail-panel-details"
        role="tabpanel"
        aria-labelledby="person-detail-tab-details"
        hidden={detailsHidden}
        aria-hidden={detailsHidden}
      >
        {details}
      </div>
    </>
  );
}
