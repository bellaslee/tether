import {
  RouteLoadingMain,
  RouteLoadingPulse,
} from '@/components/app/route-loading-skeleton';

export default function NewPersonLoading() {
  return (
    <RouteLoadingMain
      className="form-shell max-w-4xl"
      ariaLabel="Loading new person form"
    >
      <div className="space-y-4">
        <RouteLoadingPulse className="h-4 w-36" />
        <RouteLoadingPulse className="h-4 w-28" />
        <RouteLoadingPulse className="h-10 w-64 max-w-full" />
        <RouteLoadingPulse className="h-4 w-full max-w-2xl" />
      </div>
      <div className="mt-8 card-surface rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
        <div className="space-y-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <RouteLoadingPulse className="h-3 w-28" />
              <RouteLoadingPulse className="h-11 w-full rounded-xl" />
            </div>
          ))}
          <div className="flex flex-wrap gap-3 pt-2">
            <RouteLoadingPulse className="h-11 w-32 rounded-xl" />
            <RouteLoadingPulse className="h-11 w-24 rounded-xl" />
          </div>
        </div>
      </div>
    </RouteLoadingMain>
  );
}
