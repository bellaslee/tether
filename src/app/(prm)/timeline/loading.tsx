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
        <RouteLoadingPulse className="h-11 w-40 shrink-0 rounded-xl" />
      </header>
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
