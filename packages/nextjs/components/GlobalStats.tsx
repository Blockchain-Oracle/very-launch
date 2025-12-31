import { Skeleton } from "./ui/skeleton";
import { useSummaryStats } from "~~/hooks/use-fetch-global-stats";
import { formatAmount } from "~~/lib/utils";

const GlobalStats = () => {
  const { data, isLoading } = useSummaryStats();
  return (
    <div className="flex items-center gap-12 pt-8">
      <div className="flex flex-col items-start gap-2">
        <span className="text-xs text-gray-400">Total raised</span>
        {isLoading ? (
          <Skeleton className="h-14 w-14 bg-slate-600/40" />
        ) : (
          <span className="text-2xl sm:text-3xl font-semibold sm:font-bold">
            ${formatAmount(data?.totalFundingRaised || 0)}
          </span>
        )}
      </div>
      <div className="flex flex-col items-start gap-2">
        <span className="text-xs text-gray-400">Total Campaigns</span>
        {isLoading ? (
          <Skeleton className="h-14 w-14 bg-slate-600/40" />
        ) : (
          <span className="text-2xl sm:text-3xl font-semibold sm:font-bold">{data?.totalCampaigns || 0}</span>
        )}
      </div>
      <div className="flex flex-col items-start gap-2">
        <span className="text-xs text-gray-400">Active Campaigns</span>
        {isLoading ? (
          <Skeleton className="h-14 w-14 bg-slate-600/40" />
        ) : (
          <span className="text-2xl sm:text-3xl font-semibold sm:font-bold">{data?.activeCampaigns || 0}</span>
        )}
      </div>
    </div>
  );
};

export default GlobalStats;
