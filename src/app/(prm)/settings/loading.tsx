import {
  RouteLoadingMain,
  RouteLoadingPulse,
} from '@/components/app/route-loading-skeleton';

export default function SettingsLoading() {
  return (
    <RouteLoadingMain
      className="prm-shell-gutter-x mx-auto flex w-full max-w-2xl flex-1 flex-col gap-14 py-10"
      ariaLabel="Loading settings"
    >
      <div className="space-y-4">
        <RouteLoadingPulse className="h-4 w-24" />
        <RouteLoadingPulse className="h-4 w-28" />
        <RouteLoadingPulse className="h-10 w-64 max-w-full" />
        <RouteLoadingPulse className="h-4 w-full max-w-lg" />
        <div className="card-surface mt-6 space-y-3 rounded-2xl border border-border-soft p-4 sm:p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <RouteLoadingPulse key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, s) => (
        <section key={s} className="space-y-4">
          <RouteLoadingPulse className="h-8 w-48" />
          <RouteLoadingPulse className="h-4 w-full max-w-md" />
          <div className="card-surface space-y-3 rounded-[1.75rem] border border-border-soft p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <RouteLoadingPulse key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </section>
      ))}
    </RouteLoadingMain>
  );
}
