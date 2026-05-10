import {
  RouteLoadingMain,
  RouteLoadingPulse,
} from "@/components/app/route-loading-skeleton";

export default function SignupCheckEmailLoading() {
  return (
    <RouteLoadingMain
      className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16"
      ariaLabel="Loading confirmation instructions"
    >
      <div className="card-surface rounded-[2rem] border border-border-soft p-8 sm:p-10">
        <RouteLoadingPulse className="h-3 w-36" />
        <RouteLoadingPulse className="mt-3 h-8 w-56 max-w-full" />
        <RouteLoadingPulse className="mt-2 h-4 w-full" />
        <RouteLoadingPulse className="mt-2 h-4 w-full" />
        <RouteLoadingPulse className="mt-6 h-12 w-full rounded-2xl" />
        <RouteLoadingPulse className="mt-4 h-4 w-full" />
        <RouteLoadingPulse className="mx-auto mt-8 h-4 w-44" />
        <RouteLoadingPulse className="mx-auto mt-4 h-4 w-52" />
      </div>
    </RouteLoadingMain>
  );
}
