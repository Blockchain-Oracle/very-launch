"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { DepositSidebar } from "../_components/deposit-sidebar";
import { VaultHeader } from "../_components/vault-header";
import { VaultTabs } from "../_components/vault-tabs";
import { useAccount } from "wagmi";
import { Button } from "~~/components/ui/button";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export default function VaultPage() {
  const { address: connectedAddress } = useAccount();
  const params = useParams();
  const campaignId = params.id;
  const campaignIdNumber = Number(campaignId);

  const { data } = useScaffoldReadContract({
    contractName: "Launchpad",
    functionName: "campaigns",
    args: [BigInt(campaignIdNumber)],
  });

  const _campaign = useMemo(() => {
    if (!data) return undefined;
    return {
      creator: data[0],
      tokenAddress: data[1],
      uniswapPair: data[2],
      targetAmount: Number(data[3] / 10n ** 6n),
      amountRaised: Number(data[4] / 10n ** 6n),
      deadline: Number(data[5]),
      reserveRatio: Number(data[6]),
      blockNumberCreated: data[7],
      isActive: data[8],
      isFundingComplete: data[9],
      isCancelled: data[10],
      isPromoted: data[11],
      tokensSold: Number(data[12] / 10n ** 18n),
      totalSupply: Number(data[13] / 10n ** 18n),
      tokensForSale: Number(data[14] / 10n ** 18n),
      creatorAllocation: Number(data[15] / 10n ** 18n),
      liquidityAllocation: Number(data[16] / 10n ** 18n),
      platformFeeTokens: Number(data[17] / 10n ** 18n),
      promotionalOgPoints: Number(data[18]),
      id: Number(data[19]),
      name: data[20],
      symbol: data[21],
      description: data[22],
    };
  }, [data]);

  return (
    <>
      <div className="pb-2 pt-4 pl-5">
        <Button
          variant="ghost"
          size="sm"
          className="bg-[#1A1A1A] hover:bg-[#242424] text-gray-400 hover:text-white rounded-3xl px-8 border border-gray-700"
          onClick={() => window.history.back()}
        >
          Back
        </Button>
      </div>
      <div className="p-1.5 space-y-8 bg-[#0F0F0F] m-2 sm:m-4 rounded-2xl h-full">
        <div className="sm:flex">
          <div className="flex-1 p-1 sm:p-6 h-full">
            <div className="p-2 sm:p-0">
              <VaultHeader address={connectedAddress} campaign={_campaign} />
            </div>
            <VaultTabs campaign={_campaign} />
          </div>
          <div className="p-1 sm:p-6">
            <DepositSidebar campaign={_campaign} />
          </div>
        </div>
      </div>
    </>
  );
}
