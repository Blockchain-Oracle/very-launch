"use client";

import React, { useMemo } from "react";
import { InfiniteMovingCards } from "./ui/infinite-moving-cards";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export function AdvertisedCampaigns() {
  const offset = 0;
  const limit = 10;

  const { data: allCampaigns } = useScaffoldReadContract({
    contractName: "LaunchpadV2",
    functionName: "getAllCampaignsPaginated",
    args: [offset, limit],
  });

  const campaigns = useMemo(() => {
    if (!allCampaigns?.[0]) return [];

    const convertedCampaigns = allCampaigns[0].map(c => ({
      id: Number(c.id),
      creator: c.creator,
      targetAmount: Number(c.targetAmount / 10n ** 6n),
      amountRaised: Number(c.amountRaised / 10n ** 6n),
      tokensSold: Number(c.tokensSold / 10n ** 18n),
      totalSupply: Number(c.totalSupply / 10n ** 18n),
      tokensForSale: Number(c.tokensForSale / 10n ** 18n),
      creatorAllocation: Number(c.creatorAllocation / 10n ** 18n),
      liquidityAllocation: Number(c.liquidityAllocation / 10n ** 18n),
      platformFeeTokens: Number(c.platformFeeTokens / 10n ** 18n),
      deadline: Number(c.deadline),
      tokenAddress: c.tokenAddress, // mapping tokenAddress to token
      isActive: c.isActive,
      isFundingComplete: c.isFundingComplete,
      isCancelled: c.isCancelled,
      name: c.name,
      symbol: c.symbol,
      description: c.description,
      reserveRatio: Number(c.reserveRatio),
      blockNumberCreated: Number(c.blockNumberCreated),
      ogPoints: c.promotionalOgPoints ? Number(c.promotionalOgPoints) : undefined,
      isPromoted: c.isPromoted,
      uniswapPair: c.uniswapPair,
    }));
    return convertedCampaigns;
  }, [allCampaigns]);

  return (
    <div className="rounded-md flex flex-col antialiased bg-transparent items-center justify-center relative overflow-hidden py-8">
      <h1 className="text-center text-4xl md:text-6xl md:leading-16 tracking-tight font-light text-white/80 mb-12">
        Top <span className="font-medium italic instrument">rockets 🚀 </span> on our launchpad
      </h1>
      <InfiniteMovingCards items={campaigns || []} direction="right" speed="slow" />
    </div>
  );
}
