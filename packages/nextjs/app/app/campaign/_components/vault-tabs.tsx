"use client";

import { useState } from "react";
import { ActivityTab } from "./_tabs/activity-tab";
import { OverviewTab } from "./_tabs/overview-tab";
import { PerformanceTab } from "./_tabs/performance-tab";
import { YourPositionTab } from "./_tabs/your-position-tab";
import { usePoolPrice } from "./utils/pool-price";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { Button } from "~~/components/ui/button";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { ICampaign } from "~~/types/interface";

const tabs = [
  { id: "your-position", label: "Your Position" },
  { id: "overview", label: "Overview" },
  { id: "performance", label: "Performance" },
  { id: "activity", label: "Activity" },
];

export function VaultTabs({ campaign }: { campaign: ICampaign | undefined }) {
  const [activeTab, setActiveTab] = useState("overview");
  const { address: connectedAddress } = useAccount();

  const { currentPoolPrice } = usePoolPrice(campaign?.uniswapPair);

  const { data: userPosition } = useScaffoldReadContract({
    contractName: "Launchpad",
    functionName: "getUserInvestment",
    args: [campaign?.id || 0, connectedAddress || ""],
  });

  const userInvestmentInCampaign = userPosition ? Number(formatUnits(userPosition, 6)) : 0;

  return (
    <div className="h-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700 mb-8">
        {tabs.map(tab => (
          <Button
            key={tab.id}
            variant="ghost"
            className={`px-1 sm:px-2 py-4 mr-3 sm:mr-8 rounded-none border-b-2 transition-colors hover:bg-transparent hover:text-white ${
              activeTab === tab.id
                ? "border-white text-white"
                : "border-transparent text-gray-400 hover:text-white hover:bg-transparent"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="h-full">
        {activeTab === "your-position" && (
          <YourPositionTab userPosition={Number(userInvestmentInCampaign) || 0} campaign={campaign} />
        )}
        {activeTab === "overview" && (
          <OverviewTab
            amountRaised={campaign?.amountRaised || 0}
            isLive={campaign?.isFundingComplete === true}
            poolPrice={currentPoolPrice}
          />
        )}
        {activeTab === "performance" && <PerformanceTab address={connectedAddress || ""} campaign={campaign} />}
        {activeTab === "activity" && <ActivityTab campaign={campaign} />}
      </div>
    </div>
  );
}
