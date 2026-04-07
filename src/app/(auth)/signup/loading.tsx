import {
  RouteLoadingMain,
  RouteLoadingPulse,
} from '@/components/app/route-loading-skeleton';

export default function SignupLoading() {
  return (
    <RouteLoadingMain
      className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16"
      ariaLabel="Loading sign up"
    >
      <div className="card-surface rounded-[2rem] border border-border-soft p-8 sm:p-10">
        <RouteLoadingPulse className="h-3 w-36" />
        <RouteLoadingPulse className="mt-3 h-8 w-56 max-w-full" />
        <RouteLoadingPulse className="mt-2 h-4 w-full" />
        <div className="mt-8 space-y-4">
          <RouteLoadingPulse className="h-11 w-full rounded-xl" />
          <RouteLoadingPulse className="h-11 w-full rounded-xl" />
          <RouteLoadingPulse className="h-11 w-full rounded-xl" />
          <RouteLoadingPulse className="h-11 w-full rounded-xl" />
        </div>
        <RouteLoadingPulse className="mx-auto mt-8 h-4 w-52" />
      </div>
    </RouteLoadingMain>
  );
}
