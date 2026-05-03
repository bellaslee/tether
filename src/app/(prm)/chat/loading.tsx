import {
  RouteLoadingMain,
  RouteLoadingPulse,
} from '@/components/app/route-loading-skeleton';

export default function ChatLoading() {
  return (
    <RouteLoadingMain className="prm-page" ariaLabel="Loading chat">
      <div className="max-w-3xl space-y-3">
        <RouteLoadingPulse className="h-4 w-36" />
        <RouteLoadingPulse className="h-10 w-48 max-w-full" />
        <RouteLoadingPulse className="h-4 w-full max-w-2xl" />
      </div>
      <div className="mt-8 max-w-3xl space-y-4">
        <RouteLoadingPulse className="min-h-[18rem] w-full rounded-[1.75rem]" />
        <RouteLoadingPulse className="h-12 w-full rounded-2xl" />
      </div>
    </RouteLoadingMain>
  );
}
