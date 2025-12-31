import Image from "next/image";
import { usePoolPrice } from "./utils/pool-price";
import { Copy, Info } from "lucide-react";
import { toast } from "sonner";
import { useChainId, useWriteContract } from "wagmi";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { Skeleton } from "~~/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "~~/components/ui/tooltip";
import deployedContracts from "~~/contracts/deployedContracts";
import { useCopyToClipboard } from "~~/hooks/scaffold-eth";
import { formatAmount } from "~~/lib/utils";
import { ICampaign } from "~~/types/interface";

export function VaultHeader({ campaign, address }: { campaign: ICampaign | undefined; address: string | undefined }) {
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const { copyToClipboard: copy, isCopiedToClipboard } = useCopyToClipboard();

  const { poolMetrics, totalSupply, iscalculating } = usePoolPrice(campaign?.uniswapPair);

  const contracts = deployedContracts[chainId as keyof typeof deployedContracts];
  const wveryAddress = contracts && "WrappedVery" in contracts ? contracts.WrappedVery.address : "";
  const contractAddress = contracts && "LaunchpadV2" in contracts ? contracts.LaunchpadV2.address : "";
  const launchpadAbi = contracts && "LaunchpadV2" in contracts ? contracts.LaunchpadV2.abi : [];
  const wveryAbi = contracts && "WrappedVery" in contracts ? contracts.WrappedVery.abi : [];
  const amountToApprove = 1000000000000000000000;

  const promoteCampaign = async () => {
    try {
      await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: launchpadAbi as any,
        functionName: "promoteCampaign",
        args: [campaign?.id || 0],
      } as any);
    } catch (e) {
      console.error("Error promoting campaign:", e);
    }
  };

  const approveTokensAndPromote = async () => {
    try {
      await writeContractAsync({
        address: wveryAddress as `0x${string}`,
        abi: wveryAbi,
        functionName: "approve",
        args: [contractAddress, BigInt(amountToApprove)],
      });
      await promoteCampaign();
    } catch (e) {
      console.error("Approval error:", e);
    }
  };

  const copyToClipboard = () => {
    copy(campaign?.tokenAddress || "");
    if (isCopiedToClipboard) {
      toast.success("Contract Address Copied to clipboard!", {
        position: "top-right",
      });
    }
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    if (num === 0) return "0";
    if (num < 0.01) return num.toExponential(2);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const live: boolean | undefined = campaign?.isFundingComplete;

  return (
    <div className="mb-12">
      {/* Vault Title */}
      <div className="flex items-center gap-3 mb-4">
        {!campaign ? (
          <Skeleton className="h-16 w-96 bg-[#0F0F0F] rounded-2xl" />
        ) : (
          <h1 className="text-4xl sm:text-6xl font-light">
            {campaign?.name} <span className="text-gray-400">WVERY</span>
          </h1>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-transparent"
          onClick={copyToClipboard}
        >
          <Copy className="w-5 h-5" />
        </Button>
        <div className="hidden sm:block">
          {!campaign ? (
            <Skeleton className="h-10 w-20 bg-[#11181C] rounded-3xl" />
          ) : campaign.isPromoted ? (
            <div className="hover:text-white rounded-3xl bg-[#FF6B7A]/20 text-[#FF6B7A] border border-[#FF6B7A]/30 hover:bg-[#FF6B7A]/30 inline-flex items-center gap-2 px-3 py-1 cursor-pointer">
              Promoted ⚡️
            </div>
          ) : (
            campaign.creator === address && (
              <div
                className="hover:text-white rounded-3xl bg-[#FF6B7A] text-white hover:bg-[#FF8B7A] inline-flex items-center gap-2 px-3 py-1 cursor-pointer transition-colors"
                onClick={approveTokensAndPromote}
              >
                Sponsor
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 animate-pulse-fast" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    className="max-w-sm text-sm font-extralight text-gray-300 bg-[#11181C] px-3 pt-5 space-y-5"
                  >
                    <div className="flex items-center gap-4">
                      <p className="text-gray-400 text-base font-semibold pt2">Sponsor</p>
                      <span className="font-semibold">$50</span>
                    </div>
                    <p className="text-sm">
                      Sponsorship increases visibility for campaigns by promoting them to a wider audience, attracting
                      potential backers and enhancing credibility. This heightened exposure can lead to increased
                      funding opportunities and greater engagement from the community.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )
          )}
        </div>
      </div>

      {/* Badges */}
      {!campaign ? (
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-8 w-16 rounded bg-[#11181C]" />
          <Skeleton className="h-8 w-16 rounded bg-[#11181C]" />
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-6">
          <Badge
            variant="secondary"
            className="bg-[#FF6B7A]/20 text-[#FF6B7A] border-[#FF6B7A]/30 py-1 text-xs sm:text-sm"
          >
            <div className="w-2 h-2 bg-[#FF6B7A] rounded-full mr-2" />
            {campaign?.symbol}
          </Badge>
          <Badge variant="secondary" className="bg-blue-900/30 text-blue-400 border-blue-700 text-xs sm:text-sm">
            <Image src="/very.svg" alt="WVERY" width={16} height={16} className="w-5 h-5 mr-2" />
            WVERY
          </Badge>
          <div className="sm:hidden">
            {!campaign ? (
              <Skeleton className="h-7 sm:h-10 w-14 sm:w-20 bg-[#11181C] rounded-3xl" />
            ) : campaign.isPromoted ? (
              <div className="hover:text-white rounded-3xl bg-green-950 text-green-200 hover:bg-green-900 inline-flex items-center sm:gap-2 px-2 sm:px-3 py-1 cursor-pointer text-xs sm:text-base">
                Promoted ⚡️
              </div>
            ) : (
              campaign.creator === address && (
                <div
                  className="hover:text-white rounded-3xl bg-green-950 text-green-200 hover:bg-green-900 inline-flex items-center gap-2 px-2 sm:px-3 py-1 cursor-pointer text-xs sm:text-base"
                  onClick={approveTokensAndPromote}
                >
                  Sponsor
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 sm:w-4 h-3 sm:h-4 animate-pulse-fast" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-sm text-xs sm:text-sm font-extralight text-gray-400">
                      <div className="flex items-center gap-4 -mt-2">
                        <p className="text-gray-400 text-sm font-semibold pt2">Sponsor</p>
                        <span className="font-semibold">$10</span>
                      </div>
                      <p className="-mt-2">
                        Sponsorship increases visibility for campaigns by promoting them to a wider audience, attracting
                        potential backers and enhancing credibility. This heightened exposure can lead to increased
                        funding opportunities and greater engagement from the community.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {!campaign ? (
        <Skeleton className="h-4 rounded bg-[#11181C] mb-6" />
      ) : (
        <p className="text-gray-300 mb-8 w-full text-wrap sm:max-w-4xl font-light">{campaign?.description}</p>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-1 sm:gap-8 mb-8 items-center">
        <div className="flex flex-col gap-2 items-start">
          <div>
            <span className="text-gray-400/90 text-xs">{live ? "24h Volume" : "Target Amount"}</span>
          </div>

          {!campaign ? (
            <Skeleton className="h-20 w-20 rounded-2xl bg-[#11181C] mb-6" />
          ) : live ? (
            !iscalculating ? (
              <>
                <div className="text-xl sm:text-3xl font-light">${formatNumber(poolMetrics.volume24h)}</div>
                <div className="text-gray-400/90 text-xs mt-1 hidden sm:block">
                  ${formatNumber(poolMetrics.volume24h)} WVERY
                </div>
              </>
            ) : (
              <Skeleton className="h-20 w-20 rounded-2xl bg-[#11181C] mb-6" />
            )
          ) : (
            <>
              <div className="text-xl sm:text-3xl font-light">${formatAmount(campaign?.targetAmount || 0)}</div>
              <div className="text-gray-400/90 text-xs mt-1 hidden sm:block">
                {formatAmount(campaign?.targetAmount || 0)} WVERY
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 items-start">
          <div>
            <span className="text-gray-400/90 text-xs">{live ? "TVL" : "Amount Raised"}</span>
          </div>
          {!campaign ? (
            <Skeleton className="h-20 w-20 rounded-2xl bg-[#11181C] mb-6" />
          ) : live ? (
            !iscalculating ? (
              <>
                <div className="text-xl sm:text-3xl font-light">
                  ${formatAmount(Number(poolMetrics.tvl.toFixed(2)))}
                </div>
                <div className="text-gray-400/90 text-xs mt-1 hidden sm:block">
                  ${formatNumber(poolMetrics.tvl)} WVERY
                </div>
              </>
            ) : (
              <Skeleton className="h-20 w-20 rounded-2xl bg-[#11181C] mb-6" />
            )
          ) : (
            <>
              <div className="text-xl sm:text-3xl font-light">${formatAmount(campaign?.amountRaised || 0)}</div>
              <div className="text-gray-400/90 text-xs mt-1 hidden sm:block">
                {formatAmount(campaign?.amountRaised || 0)} WVERY
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 items-start">
          <div>
            <span className="text-gray-400/90 text-xs">{live ? "LP Supply" : "Deadline"}</span>
          </div>
          {live && (
            <>
              <div className="flex items-center gap-2 text-xl sm:text-3xl">{formatAmount(Number(totalSupply))}</div>
              <div className="text-gray-400/90 text-xs mt-1 hidden sm:block">
                {formatAmount(Number(totalSupply))} LP tokens
              </div>
            </>
          )}
          {!live && (
            <div className="flex items-center gap-2">
              {(() => {
                let deadlineDisplay = "N/A";
                if (campaign?.deadline !== undefined && campaign?.deadline !== null) {
                  const deadlineTimestamp = Number(campaign.deadline); // Assuming deadline is a Unix timestamp in seconds
                  const now = Math.floor(Date.now() / 1000); // Current time in seconds, floored for consistency

                  if (deadlineTimestamp <= now) {
                    deadlineDisplay = "Ended";
                  } else {
                    let remainingSeconds = deadlineTimestamp - now;

                    const days = Math.floor(remainingSeconds / (60 * 60 * 24));
                    remainingSeconds %= 60 * 60 * 24;
                    const hours = Math.floor(remainingSeconds / (60 * 60));
                    remainingSeconds %= 60 * 60;
                    const minutes = Math.floor(remainingSeconds / 60);

                    const parts = [];
                    if (days > 0) {
                      parts.push(`${days} day${days > 1 ? "s" : ""}`);
                      if (hours > 0) {
                        parts.push(`${hours} hr${hours > 1 ? "s" : ""}`);
                      }
                    } else if (hours > 0) {
                      parts.push(`${hours} hr${hours > 1 ? "s" : ""}`);
                      if (minutes > 0) {
                        parts.push(`${minutes} min${minutes > 1 ? "s" : ""}`);
                      }
                    } else if (minutes > 0) {
                      parts.push(`${minutes} min${minutes > 1 ? "s" : ""}`);
                    }

                    if (parts.length === 0) {
                      deadlineDisplay = "Less than a minute";
                    } else {
                      deadlineDisplay = parts.join(" ");
                    }
                  }
                }
                return deadlineDisplay;
              })()}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 items-start ml-auto sm:ml-0">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">{live ? "Liquidity" : "OG Point Bank"}</span>
            {!live && <Info className="w-4 h-4 text-gray-400 hidden sm:block" />}
          </div>
          {!campaign ? (
            <Skeleton className="h-20 w-20 rounded-2xl bg-[#11181C] mb-6" />
          ) : live ? (
            !iscalculating ? (
              <>
                <>
                  <span className="text-xl sm:text-3xl font-light">${formatNumber(poolMetrics.liquidity)}</span>
                  <div className="text-gray-400/90 text-xs mt-1 hidden sm:block">
                    ${formatNumber(poolMetrics.tvl)} WVERY
                  </div>
                </>
              </>
            ) : (
              <Skeleton className="h-20 w-20 rounded-2xl bg-[#11181C] mb-6" />
            )
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-3xl font-light">{campaign?.promotionalOgPoints}</span>
                <div className="flex items-center text-blue-400">
                  <span className="text-lg">✦</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
