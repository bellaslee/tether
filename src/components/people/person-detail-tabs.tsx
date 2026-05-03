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
import {
  type PersonDetailTab,
  PERSON_DETAIL_TAB_ORDER,
  parsePersonDetailTabParam,
  personDetailTabSearchParam,
} from '@/lib/people/person-detail-tab';

export type { PersonDetailTab } from '@/lib/people/person-detail-tab';

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
    setTabState(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const readTabFromLocation = (): PersonDetailTab =>
      parsePersonDetailTabParam(
        new URLSearchParams(window.location.search).get('tab'),
      );

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
      const param = personDetailTabSearchParam(next);
      const url = param ? `${pathOnly}?tab=${param}` : pathOnly;
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

const TAB_IDS: Record<PersonDetailTab, string> = {
  profile: 'person-detail-tab-profile',
  memory: 'person-detail-tab-memory',
  timeline: 'person-detail-tab-timeline',
  contacts: 'person-detail-tab-contacts',
};

const PANEL_IDS: Record<PersonDetailTab, string> = {
  profile: 'person-detail-panel-profile',
  memory: 'person-detail-panel-memory',
  timeline: 'person-detail-panel-timeline',
  contacts: 'person-detail-panel-contacts',
};

export function PersonDetailTabNav({
  profileSectionsAria,
  labels,
}: {
  profileSectionsAria: string;
  labels: {
    profile: string;
    memory: string;
    timeline: string;
    contacts: string;
  };
}) {
  const { tab, setTab } = usePersonDetailTabs();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const labelFor = (t: PersonDetailTab) => labels[t];

  const focusTabAt = (index: number) => {
    const clamped = Math.max(
      0,
      Math.min(PERSON_DETAIL_TAB_ORDER.length - 1, index),
    );
    queueMicrotask(() => tabRefs.current[clamped]?.focus());
  };

  return (
    <nav
      role="tablist"
      aria-label={profileSectionsAria}
      className="flex w-full flex-wrap gap-x-6 gap-y-3 sm:gap-x-8"
    >
      {PERSON_DETAIL_TAB_ORDER.map((tabKey, index) => {
        const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            if (index < PERSON_DETAIL_TAB_ORDER.length - 1) {
              e.preventDefault();
              const next = index + 1;
              setTab(PERSON_DETAIL_TAB_ORDER[next]);
              focusTabAt(next);
            }
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            if (index > 0) {
              e.preventDefault();
              const next = index - 1;
              setTab(PERSON_DETAIL_TAB_ORDER[next]);
              focusTabAt(next);
            }
          }
        };

        const isActive = tab === tabKey;

        return (
          <button
            key={tabKey}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={TAB_IDS[tabKey]}
            aria-selected={isActive}
            aria-controls={PANEL_IDS[tabKey]}
            tabIndex={isActive ? 0 : -1}
            className={isActive ? tabLinkActive : tabLinkInactive}
            onClick={() => setTab(tabKey)}
            onKeyDown={onKeyDown}
          >
            {labelFor(tabKey)}
          </button>
        );
      })}
    </nav>
  );
}

function TabPanel({
  tabKey,
  children,
}: {
  tabKey: PersonDetailTab;
  children: ReactNode;
}) {
  const { tab } = usePersonDetailTabs();
  const hidden = tab !== tabKey;

  return (
    <div
      id={PANEL_IDS[tabKey]}
      role="tabpanel"
      aria-labelledby={TAB_IDS[tabKey]}
      hidden={hidden}
      aria-hidden={hidden}
    >
      {children}
    </div>
  );
}

export function PersonDetailTabPanels({
  profile,
  memory,
  timeline,
  contacts,
}: {
  profile: ReactNode;
  memory: ReactNode;
  timeline: ReactNode;
  contacts: ReactNode;
}) {
  return (
    <>
      <TabPanel tabKey="profile">{profile}</TabPanel>
      <TabPanel tabKey="memory">{memory}</TabPanel>
      <TabPanel tabKey="timeline">{timeline}</TabPanel>
      <TabPanel tabKey="contacts">{contacts}</TabPanel>
    </>
  );
}
