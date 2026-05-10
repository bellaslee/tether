import {
  RouteLoadingMain,
  RouteLoadingHero,
  RouteLoadingPulse,
} from '@/components/app/route-loading-skeleton';

export default function TimelineTypesLoading() {
  return (
    <RouteLoadingMain className="page-frame" ariaLabel="Loading timeline types">
      <RouteLoadingHero withPrimaryAction />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="card-surface flex items-center gap-4 rounded-2xl border border-border-soft px-4 py-4"
          >
            <RouteLoadingPulse className="h-5 flex-1 rounded-lg" />
            <RouteLoadingPulse className="h-9 w-20 shrink-0 rounded-lg" />
          </div>
        ))}
      </div>
    </RouteLoadingMain>
  );
}
