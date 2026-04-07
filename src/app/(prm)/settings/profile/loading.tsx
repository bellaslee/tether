import {
  RouteLoadingMain,
  RouteLoadingPulse,
} from '@/components/app/route-loading-skeleton';

export default function ProfileSettingsLoading() {
  return (
    <RouteLoadingMain
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-6 py-10 sm:px-10 lg:px-12"
      ariaLabel="Loading profile settings"
    >
      <div className="space-y-4">
        <RouteLoadingPulse className="h-4 w-24" />
        <RouteLoadingPulse className="h-4 w-28" />
        <RouteLoadingPulse className="h-10 w-56 max-w-full" />
        <RouteLoadingPulse className="h-4 w-full max-w-md" />
      </div>
      <RouteLoadingPulse className="h-28 w-full rounded-2xl" />
      <div className="card-surface space-y-6 rounded-[1.75rem] border border-border-soft p-6 sm:p-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <RouteLoadingPulse className="h-3 w-24" />
            <RouteLoadingPulse className="h-11 w-full rounded-xl" />
          </div>
        ))}
        <RouteLoadingPulse className="h-11 w-40 rounded-xl" />
      </div>
    </RouteLoadingMain>
  );
}
