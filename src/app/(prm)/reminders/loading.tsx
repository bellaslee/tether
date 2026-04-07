import {
  RouteLoadingMain,
  RouteLoadingPrmHero,
  RouteLoadingPulse,
} from '@/components/app/route-loading-skeleton';

export default function RemindersLoading() {
  return (
    <RouteLoadingMain className="prm-page" ariaLabel="Loading reminders">
      <RouteLoadingPrmHero />
      <div className="mt-6">
        <RouteLoadingPulse className="h-5 w-56" />
      </div>
      <div className="mt-10 space-y-10">
        <section className="space-y-4">
          <RouteLoadingPulse className="h-6 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <RouteLoadingPulse
                key={i}
                className="h-24 w-full rounded-[1.75rem]"
              />
            ))}
          </div>
        </section>
        <section className="space-y-4">
          <RouteLoadingPulse className="h-6 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <RouteLoadingPulse
                key={i}
                className="h-20 w-full rounded-[1.75rem]"
              />
            ))}
          </div>
        </section>
      </div>
    </RouteLoadingMain>
  );
}
