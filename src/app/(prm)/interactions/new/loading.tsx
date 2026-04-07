import {
  RouteLoadingMain,
  RouteLoadingPulse,
} from '@/components/app/route-loading-skeleton';

export default function NewInteractionLoading() {
  return (
    <RouteLoadingMain
      className="prm-form-shell max-w-3xl"
      ariaLabel="Loading new interaction form"
    >
      <div className="space-y-4">
        <RouteLoadingPulse className="h-4 w-28" />
        <RouteLoadingPulse className="h-4 w-24" />
        <RouteLoadingPulse className="h-10 w-full max-w-lg" />
        <RouteLoadingPulse className="h-4 w-full max-w-2xl" />
      </div>
      <div className="mt-8 card-surface space-y-6 rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <RouteLoadingPulse className="h-3 w-32" />
            <RouteLoadingPulse className="h-11 w-full rounded-xl" />
          </div>
        ))}
        <RouteLoadingPulse className="min-h-[8rem] w-full rounded-xl" />
        <div className="flex flex-wrap gap-3">
          <RouteLoadingPulse className="h-11 w-36 rounded-xl" />
          <RouteLoadingPulse className="h-11 w-28 rounded-xl" />
        </div>
      </div>
    </RouteLoadingMain>
  );
}
