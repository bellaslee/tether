import {
  RouteLoadingMain,
  RouteLoadingPulse,
} from '@/components/app/route-loading-skeleton';

/** Full person profile (default Overview tab: context, briefs, facts, reminders, timeline). */
export default function PersonDetailLoading() {
  return (
    <RouteLoadingMain className="prm-page" ariaLabel="Loading person profile">
      <div className="prm-person-sticky-header sticky top-0 z-40 -mx-6 w-[calc(100%+3rem)] max-w-none px-6 pt-2 sm:-mx-10 sm:w-[calc(100%+5rem)] sm:px-10 lg:-mx-12 lg:w-[calc(100%+6rem)] lg:px-12">
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
          <div className="flex gap-8 pt-1">
            <RouteLoadingPulse className="h-9 w-24" />
            <RouteLoadingPulse className="h-9 w-48" />
          </div>
        </div>
      </div>

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

      <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-stretch">
        <div className="card-surface min-h-[14rem] rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
          <RouteLoadingPulse className="h-8 w-24" />
          <RouteLoadingPulse className="mt-2 h-4 w-full max-w-sm" />
          <div className="mt-6 space-y-3">
            <RouteLoadingPulse className="h-20 w-full rounded-2xl" />
            <RouteLoadingPulse className="h-20 w-full rounded-2xl" />
          </div>
        </div>
        <div className="card-surface min-h-[14rem] rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
          <RouteLoadingPulse className="h-8 w-36" />
          <RouteLoadingPulse className="mt-2 h-4 w-full max-w-xs" />
          <div className="mt-6 space-y-3">
            <RouteLoadingPulse className="h-16 w-full rounded-2xl" />
            <RouteLoadingPulse className="h-16 w-full rounded-2xl" />
          </div>
        </div>
      </div>

      <div className="mt-8 card-surface space-y-6 rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1 space-y-3">
            <RouteLoadingPulse className="h-8 w-40" />
            <RouteLoadingPulse className="h-4 w-full max-w-2xl" />
            <RouteLoadingPulse className="h-4 w-full max-w-xl" />
          </div>
          <RouteLoadingPulse className="h-10 w-36 shrink-0 rounded-xl" />
        </div>
        <div className="space-y-6 pt-2">
          <RouteLoadingPulse className="h-3 w-24" />
          <RouteLoadingPulse className="h-40 w-full rounded-[1.75rem]" />
          <RouteLoadingPulse className="h-40 w-full rounded-[1.75rem]" />
          <RouteLoadingPulse className="h-40 w-full rounded-[1.75rem]" />
        </div>
      </div>
    </RouteLoadingMain>
  );
}
