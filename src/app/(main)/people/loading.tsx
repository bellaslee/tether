import {
  RouteLoadingMain,
  RouteLoadingHero,
  RouteLoadingPulse,
} from '@/components/app/route-loading-skeleton';

export default function PeopleListLoading() {
  return (
    <RouteLoadingMain className="page-frame" ariaLabel="Loading people">
      <RouteLoadingHero withPrimaryAction />

      <div className="mt-8 flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-start lg:gap-x-10 lg:gap-y-4">
        <section className="card-surface order-2 min-h-[12rem] min-w-0 rounded-[1.75rem] border border-border-soft p-6 sm:p-8 lg:order-none lg:col-start-1 lg:row-start-1 lg:row-span-2">
          <div className="space-y-4">
            <RouteLoadingPulse className="h-5 w-32" />
            <RouteLoadingPulse className="h-10 w-full rounded-2xl" />
            <RouteLoadingPulse className="h-24 w-full rounded-2xl" />
            <RouteLoadingPulse className="h-24 w-full rounded-2xl" />
          </div>
        </section>

        <section className="order-1 min-w-0 space-y-3 lg:col-start-2 lg:row-start-1">
          <RouteLoadingPulse className="h-9 w-full max-w-md rounded-2xl" />
          <RouteLoadingPulse className="h-9 w-full max-w-lg rounded-2xl" />
        </section>

        <section className="order-3 min-w-0 space-y-6 lg:col-start-2 lg:row-start-2">
          <div className="space-y-3">
            <RouteLoadingPulse className="h-7 w-40" />
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <li key={i}>
                  <RouteLoadingPulse className="h-24 w-full rounded-2xl" />
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <RouteLoadingPulse className="h-7 w-36" />
            <ul className="grid grid-cols-1 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i}>
                  <RouteLoadingPulse className="h-20 w-full rounded-2xl" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </RouteLoadingMain>
  );
}
