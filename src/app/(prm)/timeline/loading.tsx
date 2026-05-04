import {
  RouteLoadingMain,
  RouteLoadingPulse,
} from '@/components/app/route-loading-skeleton';

export default function TimelineLoading() {
  return (
    <RouteLoadingMain className="prm-page" ariaLabel="Loading timeline">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-3">
          <RouteLoadingPulse className="h-4 w-40" />
          <RouteLoadingPulse className="h-10 w-48 max-w-full" />
          <RouteLoadingPulse className="h-4 w-full max-w-2xl" />
          <RouteLoadingPulse className="h-4 w-full max-w-xl" />
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
          <RouteLoadingPulse className="h-11 w-28 shrink-0 rounded-xl" />
          <RouteLoadingPulse className="h-11 w-40 shrink-0 rounded-xl" />
        </div>
      </header>
      <div className="mt-6 flex gap-3 overflow-hidden">
        <RouteLoadingPulse className="h-28 w-40 shrink-0 rounded-2xl" />
        <RouteLoadingPulse className="h-28 w-40 shrink-0 rounded-2xl" />
        <RouteLoadingPulse className="h-28 w-36 shrink-0 rounded-2xl" />
      </div>
      <div className="mt-10 space-y-10">
        <div className="space-y-4">
          <RouteLoadingPulse className="h-3 w-28" />
          <RouteLoadingPulse className="h-36 w-full rounded-[1.75rem]" />
          <RouteLoadingPulse className="h-36 w-full rounded-[1.75rem]" />
        </div>
        <div className="space-y-4">
          <RouteLoadingPulse className="h-3 w-20" />
          <RouteLoadingPulse className="h-36 w-full rounded-[1.75rem]" />
          <RouteLoadingPulse className="h-36 w-full rounded-[1.75rem]" />
          <RouteLoadingPulse className="h-36 w-full rounded-[1.75rem]" />
        </div>
      </div>
    </RouteLoadingMain>
  );
}
