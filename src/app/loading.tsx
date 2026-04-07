import {
  RouteLoadingMain,
  RouteLoadingPulse,
} from '@/components/app/route-loading-skeleton';

export default function HomeLoading() {
  return (
    <RouteLoadingMain
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-8 sm:px-10 lg:px-12"
      ariaLabel="Loading home"
    >
      <section className="card-surface overflow-hidden rounded-[2rem] border border-border-soft">
        <div className="grid gap-10 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.15fr_1fr] lg:px-12 lg:py-12">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <RouteLoadingPulse className="h-7 w-24 rounded-full" />
              <RouteLoadingPulse className="h-7 w-28 rounded-full" />
            </div>
            <RouteLoadingPulse className="h-14 w-full max-w-xl" />
            <RouteLoadingPulse className="h-5 w-full max-w-2xl" />
            <RouteLoadingPulse className="h-5 w-full max-w-2xl" />
            <div className="flex flex-wrap gap-3">
              <RouteLoadingPulse className="h-11 w-32 rounded-xl" />
              <RouteLoadingPulse className="h-11 w-28 rounded-xl" />
            </div>
            <RouteLoadingPulse className="h-4 w-full max-w-md" />
          </div>
          <div className="flex flex-col gap-4">
            <RouteLoadingPulse className="h-4 w-48" />
            <RouteLoadingPulse className="h-28 w-full rounded-[1.5rem]" />
            <RouteLoadingPulse className="h-32 w-full rounded-[1.5rem]" />
            <RouteLoadingPulse className="h-28 w-full rounded-[1.5rem]" />
          </div>
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="card-surface flex min-h-[12rem] flex-col rounded-[1.75rem] border border-border-soft p-6 sm:p-8"
          >
            <RouteLoadingPulse className="h-3 w-24" />
            <RouteLoadingPulse className="mt-3 h-8 w-4/5" />
            <RouteLoadingPulse className="mt-4 h-4 w-full flex-1 rounded-lg" />
            <RouteLoadingPulse className="mt-2 h-4 w-full rounded-lg" />
          </div>
        ))}
      </section>
      <section className="space-y-6">
        <div className="space-y-3 text-center">
          <RouteLoadingPulse className="mx-auto h-4 w-40" />
          <RouteLoadingPulse className="mx-auto h-9 w-64 max-w-full" />
          <RouteLoadingPulse className="mx-auto h-4 w-full max-w-2xl" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="card-surface rounded-2xl border border-border-soft p-6"
            >
              <RouteLoadingPulse className="h-5 w-3/4" />
              <RouteLoadingPulse className="mt-3 h-16 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </section>
    </RouteLoadingMain>
  );
}
