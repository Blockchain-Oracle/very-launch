// hooks/useSummaryStats.ts
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export type SummaryStats = {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  cancelledCampaigns: number;
  expiredCampaigns: number;
  totalFundingRaised: number;
};

export const useSummaryStats = () => {
  const { data, isLoading, error } = useScaffoldReadContract({
    contractName: "LaunchpadV2",
    functionName: "getSummaryStats",
  });

  // Log for debugging
  console.log("Raw contract data:", data);
  // console.log("Contract error:", error);

  // The contract returns a tuple, so we need to destructure it
  // Convert USDC amounts from 6 decimals to readable numbers
  const formattedData: SummaryStats | undefined = data
    ? {
        totalCampaigns: Number(data[0]),
        activeCampaigns: Number(data[1]),
        completedCampaigns: Number(data[2]),
        cancelledCampaigns: Number(data[3]),
        expiredCampaigns: Number(data[4]),
        totalFundingRaised: Number(data[5] / 10n ** 6n), // Convert from USDC 6 decimals
      }
    : undefined;

  console.log("Formatted data:", formattedData);

  return {
    data: formattedData,
    isLoading,
    error,
  };
};
