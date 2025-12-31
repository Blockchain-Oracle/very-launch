import Image from "next/image";
import { usePoolPrice } from "../utils/pool-price";
import { BrushCleaning, ExternalLink } from "lucide-react";
import { Address } from "~~/components/scaffold-eth";
import { Card } from "~~/components/ui/card";
import { Skeleton } from "~~/components/ui/skeleton";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";
import { formatAmount } from "~~/lib/utils";
import { ICampaign } from "~~/types/interface";

export function ActivityTab({ campaign }: { campaign: ICampaign | undefined }) {
  const { data: events, isLoading: isLoadingEvents } = useScaffoldEventHistory({
    contractName: "Launchpad",
    eventName: "TokensPurchased",
    fromBlock: BigInt(campaign?.blockNumberCreated || 0),
    watch: true,
    filters: { campaignId: BigInt(campaign?.id || 0) },
    blockData: true,
    transactionData: true,
    receiptData: true,
    enabled: !!campaign?.id && !!campaign?.blockNumberCreated && !!campaign?.isActive,
  });
  const { swapEvents } = usePoolPrice(campaign?.uniswapPair || "");

  console.log("buy events", events);
  console.log("swaps", swapEvents);

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    if (num === 0) return "0";
    if (num < 0.01) return num.toExponential(2);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        {campaign?.isFundingComplete ? (
          <>
            <div className="mb-6">
              <h3 className="text-lg text-gray-300">Recent Trading Activity</h3>
            </div>
            <div className="bg-[#11181C] border-[#24353d] border rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700 text-gray-400 text-xs">
                <div>Type</div>
                <div className="flex items-center gap-1">
                  Time
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div>Amount</div>
                <div>To</div>
                <div>Transaction</div>
              </div>

              {/* Transaction Row */}
              {swapEvents.length > 0 ? (
                swapEvents.slice(0, 50).map((event, index) => (
                  <div
                    key={`${event.transactionHash}-${index}`}
                    className="grid grid-cols-5 gap-2 p-4 text-xs overflow-x-scroll"
                  >
                    <div className="py-3">
                      <span
                        className={`px-2 py-1 rounded-2xl text-xs font-medium ${
                          event.type === "buy" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {event.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-gray-300 pt-2">{formatTimeAgo(event.timestamp)}</div>
                    <span className="text-white pt-2">
                      ${formatNumber(Math.max(event.amountInUSD, event.amountOutUSD))}
                    </span>
                    <a
                      href={`https://sepolia.etherscan.io/address/${event.sender}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="flex items-center gap-2 hover:bg-[#546054b0] w-3/4 py-1 px-2 rounded-2xl">
                        <Address size="xs" address={event.sender} />
                        <ExternalLink className="w-4 h-4 mb-1" />
                      </div>
                    </a>

                    <a
                      href={`https://sepolia.etherscan.io/tx/${event.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-gray-400 pt-2"
                    >
                      {formatAddress(event.transactionHash)}
                    </a>
                  </div>
                ))
              ) : (
                <Card className="bg-[#19242a] border-[#3e545f] h-64">
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 rounded-full flex justify-center items-center bg-[#546054b0] text-[#8daa98]">
                        <BrushCleaning size={27} />
                      </div>

                      <div className="flex flex-col items-start gap-2">
                        <div className="font-medium text-lg text-[#8daa98]">No activities found</div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-lg text-gray-300">All Transactions</h3>
            </div>
            <div className="mt-5 bg-[#11181C] border-[#24353d] border rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-gray-700 text-gray-400 text-xs">
                <div className="flex items-center gap-1">
                  Date
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div>user</div>
                <div>Amount</div>
                <div>Received</div>
              </div>

              {isLoadingEvents ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="w-full h-48 rounded-2xl bg-slate-600/40" />
                ))
              ) : events.length > 0 ? (
                events.reverse().map((event, index) => {
                  return (
                    <div key={index} className="grid grid-cols-4 gap-2 p-4 text-xs overflow-x-scroll">
                      <div className="text-gray-300 pt-2">
                        {new Date(Number(event.args.timestamp) * 1000).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2 hover:bg-[#546054b0] w-3/4 py-1 px-2 rounded-2xl">
                        <Address size="xs" address={event.args.buyer} />
                        <ExternalLink className="w-4 h-4 mb-1" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Image src="/very.svg" alt="WVERY" width={16} height={16} className="w-4 h-4" />
                        <span className="text-white">{formatAmount(Number(event.args.usdcAmount) / 1e6)} WVERY</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                        <span className="text-white">{formatAmount(Number(event.args.tokensReceived) / 1e18)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <Card className="bg-[#19242a] border-[#3e545f] h-64">
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-16 w-16 rounded-full flex justify-center items-center bg-[#546054b0] text-[#8daa98]">
                        <BrushCleaning size={27} />
                      </div>

                      <div className="flex flex-col items-start gap-2">
                        <div className="font-medium text-lg text-[#8daa98]">No activities found</div>
                        <div className="text-[#546054b0] text-xs">Buy in to this campaign</div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
