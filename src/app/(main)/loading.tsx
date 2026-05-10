import {
  RouteLoadingMain,
  RouteLoadingHero,
  RouteLoadingPulse,
} from '@/components/app/route-loading-skeleton';

/** Fallback while any PRM route without a closer `loading.tsx` resolves. */
export default function MainSegmentLoading() {
  return (
    <RouteLoadingMain className="page-frame" ariaLabel="Loading">
      <RouteLoadingHero withPrimaryAction />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <RouteLoadingPulse className="min-h-[14rem] rounded-[1.75rem]" />
        <RouteLoadingPulse className="min-h-[14rem] rounded-[1.75rem]" />
      </div>
      <div className="mt-8 space-y-4">
        <RouteLoadingPulse className="h-36 w-full rounded-[1.75rem]" />
        <RouteLoadingPulse className="h-36 w-full rounded-[1.75rem]" />
      </div>
    </RouteLoadingMain>
  );
}
