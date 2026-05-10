import {
  RouteLoadingMain,
  RouteLoadingPulse,
} from '@/components/app/route-loading-skeleton';

/** Sticky header row + tab strip (matches person detail loading route). */
export function PersonDetailLoadingHeaderSkeleton() {
  return (
    <div className="person-sticky-header sticky top-0 z-40 -mx-6 w-[calc(100%+3rem)] max-w-none px-6 pt-2 sm:-mx-10 sm:w-[calc(100%+5rem)] sm:px-10 lg:-mx-12 lg:w-[calc(100%+6rem)] lg:px-12">
      <div className="w-full space-y-4 border-b border-border-soft pb-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <RouteLoadingPulse className="h-4 w-24" />
            <RouteLoadingPulse className="h-4 w-20" />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <RouteLoadingPulse className="h-10 max-w-[min(100%,14rem)] flex-1 rounded-lg" />
              <RouteLoadingPulse className="h-7 w-24 rounded-full" />
              <RouteLoadingPulse className="h-7 w-20 rounded-full" />
            </div>
          </div>
          <div className="flex shrink-0 gap-3">
            <RouteLoadingPulse className="h-11 w-28 rounded-xl" />
            <RouteLoadingPulse className="h-11 w-40 rounded-xl" />
          </div>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1 sm:gap-x-8">
          <RouteLoadingPulse className="h-9 w-16" />
          <RouteLoadingPulse className="h-9 w-20" />
          <RouteLoadingPulse className="h-9 w-24" />
          <RouteLoadingPulse className="h-9 w-44 sm:w-48" />
        </div>
      </div>
    </div>
  );
}

/** Main grid below tabs (matches person detail loading route). */
export function PersonDetailLoadingBodySkeleton() {
  return (
    <div className="mt-8 flex min-w-0 flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-stretch lg:gap-8">
      <div className="card-surface min-h-[18rem] rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
        <RouteLoadingPulse className="h-8 w-32" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <RouteLoadingPulse className="h-3 w-20" />
              <RouteLoadingPulse className="h-4 w-full max-w-[12rem]" />
            </div>
          ))}
          <div className="space-y-2 sm:col-span-2 lg:col-span-1 xl:col-span-2">
            <RouteLoadingPulse className="h-3 w-28" />
            <RouteLoadingPulse className="h-16 w-full rounded-2xl" />
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-1 xl:col-span-2">
            <RouteLoadingPulse className="h-3 w-40" />
            <RouteLoadingPulse className="h-16 w-full rounded-2xl" />
          </div>
        </div>
      </div>
      <div className="card-surface min-h-[18rem] rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
        <RouteLoadingPulse className="h-8 w-28" />
        <RouteLoadingPulse className="mt-2 h-4 w-full max-w-md" />
        <div className="mt-8 space-y-6">
          <RouteLoadingPulse className="h-32 w-full rounded-2xl" />
          <RouteLoadingPulse className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/** Full-page skeleton for the `/people/[id]` route `loading.tsx` segment. */
export default function PersonDetailPageSkeleton() {
  return (
    <RouteLoadingMain className="page-frame" ariaLabel="Loading person profile">
      <PersonDetailLoadingHeaderSkeleton />
      <PersonDetailLoadingBodySkeleton />
    </RouteLoadingMain>
  );
}
