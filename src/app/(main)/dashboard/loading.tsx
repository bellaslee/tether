import {
  RouteLoadingMain,
  RouteLoadingHero,
  RouteLoadingPulse,
} from '@/components/app/route-loading-skeleton';

export default function DashboardLoading() {
  return (
    <RouteLoadingMain className="page-frame" ariaLabel="Loading dashboard">
      <RouteLoadingHero withPrimaryAction={false} />
      <div className="mt-8">
        <RouteLoadingPulse className="min-h-[22rem] w-full rounded-[1.75rem]" />
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <RouteLoadingPulse className="min-h-[14rem] rounded-[1.75rem]" />
        <RouteLoadingPulse className="min-h-[14rem] rounded-[1.75rem]" />
      </div>
    </RouteLoadingMain>
  );
}
