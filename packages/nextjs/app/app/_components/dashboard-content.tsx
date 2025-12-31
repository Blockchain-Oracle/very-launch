import { useMemo } from "react";
import Link from "next/link";
import CreateCampaignDrawer from "./create-campaign-drawer";
import TableRow from "./table-row";
import { ArrowDown, BrushCleaning, ExpandIcon, Gift, Search, SortAsc } from "lucide-react";
import { useAccount } from "wagmi";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { Card } from "~~/components/ui/card";
import { Input } from "~~/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "~~/components/ui/select";
import { Skeleton } from "~~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~~/components/ui/tabs";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { formatAmount } from "~~/lib/utils";

export function DashboardContent() {
  const { address: connectedAddress } = useAccount();

  const { data: rawusersParticipatedCampaigns } = useScaffoldReadContract({
    contractName: "LaunchpadV2",
    functionName: "getUserParticipatedCampaignsWithInvestmentCheck",
    args: [connectedAddress],
  });

  const { data: rawCampaignsByCreator } = useScaffoldReadContract({
    contractName: "LaunchpadV2",
    functionName: "getCampaignsByCreator",
    args: [connectedAddress],
  });

  const campaignsByCreator = useMemo(() => {
    if (!rawCampaignsByCreator) return [];
    return rawCampaignsByCreator?.map(c => ({
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
  }, [rawCampaignsByCreator]);

  const usersParticipatedCampaigns = useMemo(() => {
    if (!rawusersParticipatedCampaigns) return [];
    return rawusersParticipatedCampaigns?.map(c => ({
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
  }, [rawusersParticipatedCampaigns]);

  const { data: usertotalInvestment } = useScaffoldReadContract({
    contractName: "LaunchpadV2",
    functionName: "getUserTotalInvestment",
    args: [connectedAddress],
  });

  const totalInvestment = useMemo(() => {
    if (!usertotalInvestment) {
      // Return a default object with the expected structure when data is not available
      return { amount: 0, campaigns: [] };
    }

    // Assuming usertotalInvestment is a tuple returned from the contract:
    // [totalAmount: bigint, campaignIds: bigint[]]
    const [rawAmount, rawCampaigns] = usertotalInvestment;

    return {
      // Convert the total amount from 6 decimals (e.g., USDC) to a standard number
      amount: Number(rawAmount / 10n ** 6n),
      // Convert each campaign ID from bigint to number
      campaigns: rawCampaigns,
    };
  }, [usertotalInvestment]);

  const { data: userOgPoints } = useScaffoldReadContract({
    contractName: "Launchpad",
    functionName: "ogPoints",
    args: [connectedAddress],
  });

  return (
    <div className="p-1.5 space-y-8 bg-[#0F0F0F] m-2 sm:m-4 rounded-2xl">
      {/* Top section with deposits and APY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-5 px-3 sm:py-16 sm:p-6">
        {/* Your deposits */}
        <div className="lg:col-span-1">
          <Card className="bg-[#19242a] border-[#3e545f] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-white rounded-full"></div>
                <span className="text-gray-300 text-sm">Your deposits</span>
              </div>
              <ExpandIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="text-4xl font-light text-white">
              ${totalInvestment.amount > 0 ? formatAmount(totalInvestment.amount) : "0.00"}
            </div>
          </Card>
        </div>

        {/* Center card with progress bar */}
        <div className="lg:col-span-1">
          <Card className="bg-[#19242a] border-[#3e545f] p-6 h-full">
            <div className="w-full bg-gray-700 rounded-full h-1 mb-4">
              <div className="bg-[#FF6B7A] h-1 rounded-full w-1/3"></div>
            </div>
            <div className="h-full flex items-center justify-center"></div>
          </Card>
        </div>

        {/* Net APY */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            <div>
              <div className="text-gray-400 text-sm mb-1">OG Points ⚡️</div>
              <div className="text-4xl font-light text-white inline-flex items-center gap-2">
                {userOgPoints || 0} <span>✨</span>
              </div>
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent hover:bg-transparent hover:text-white border-gray-600 text-gray-300"
              >
                <Gift className="h-4 w-4 mr-2" />
                Rewards
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom section with tabs and table */}
      <div className="space-y-6 bg-[#1A1A1A] px-3 py-4 sm:p-6 rounded-2xl">
        {/* Tabs */}
        <Tabs defaultValue="participated-campaign" className="space-y-6">
          <TabsList className="bg-transparent space-x-4 sm:space-x-8">
            <TabsTrigger
              className="bg-transparent text-sm sm:text-2xl data-[state=active]:bg-transparent data-[state=active]:text-white ata-[state=active]:font-semibold px-0 text-white/40 flex items-center gap-1.5 sm:gap-3"
              value="created-campaigns"
            >
              Your campaigns
              <Badge className="text-gray-300 bg-gray-700">{campaignsByCreator.length}</Badge>
            </TabsTrigger>
            <TabsTrigger
              className="bg-transparent text-sm sm:text-2xl data-[state=active]:bg-transparent data-[state=active]:text-white ata-[state=active]:font-semibold px-0 text-white/40 flex items-center gap-1.5 sm:gap-3"
              value="participated-campaign"
            >
              Campaigns
              <Badge className="text-[#8daa98] bg-[#25333b]">{usersParticipatedCampaigns.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="created-campaigns" className="space-y-6">
            <p className="text-gray-500">Campaigns you create will appear here</p>
            {/* Filters and search */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm hidden sm:block">Sort:</span>

                  <Select>
                    <SelectTrigger className="sm:border-[#171e23] border border-[#25333b] focus:border-gray-500">
                      <div className="hidden sm:block">
                        <SelectValue placeholder="Sort by" />
                      </div>
                      <SortAsc className="sm:hidden" />
                    </SelectTrigger>
                    <SelectContent className="text-gray-300 bg-[#11181C] border-[#3e545f]">
                      <SelectGroup>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-gray-400 border-[#25333b] sm:hidden bg-transparent"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <CreateCampaignDrawer />
                <div className="relative w-64 hidden sm:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Filter vaults"
                    className="pl-10 bg-transparent border-[#25333b] rounded-lg h-10 text-white placeholder-gray-400 focus:border-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            {campaignsByCreator.length > 0 ? (
              <div className="rounded-lg">
                {/* Table header */}
                <div className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700 text-gray-400/70 text-xs bg-[#19242a] mb-4 rounded-t-2xl">
                  <div>Campaign</div>
                  <div>Amount</div>
                  <div className="flex items-center space-x-1">
                    <span>Creator</span>
                    <ArrowDown className="h-3 w-3" />
                  </div>
                  <div>Status</div>
                  <div>Indulge</div>
                </div>

                <div className="space-y-3">
                  {!campaignsByCreator
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton className="h-20 bg-[#0F0F0F]/50 w-full rounded-2xl" key={i} />
                      ))
                    : campaignsByCreator?.map(campaign => <TableRow key={campaign.id} campaign={campaign} />)}
                </div>
              </div>
            ) : (
              <Card className="bg-[#19242a] border-[#3e545f] h-64">
                <div className="flex items-center justify-center w-full h-full">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full flex justify-center items-center bg-[#546054b0] text-[#8daa98]">
                      <BrushCleaning size={27} />
                    </div>

                    <div className="flex flex-col items-start gap-2">
                      <div className="font-medium text-lg text-[#8daa98]">No campaign found</div>
                      <div className="text-[#546054b0] text-xs">Create a campaign to start</div>
                    </div>

                    <CreateCampaignDrawer />
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="participated-campaign" className="space-y-6">
            <p className="text-gray-500 text-sm sm:text-base">Campaigns you participate in will appear here</p>
            {/* Filters and search */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm hidden sm:block">Sort:</span>
                  <Select>
                    <SelectTrigger className="sm:border-[#171e23] border border-gray-600 focus:border-gray-500">
                      <div className="hidden sm:block">
                        <SelectValue placeholder="Sort by" />
                      </div>
                      <SortAsc className="sm:hidden" />
                    </SelectTrigger>
                    <SelectContent className="text-gray-300 bg-[#11181C] border-[#3e545f]">
                      <SelectGroup>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-gray-400 border-[#25333b] sm:hidden bg-transparent"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center sm:space-x-2">
                <CreateCampaignDrawer />
                <div className="relative w-64 hidden sm:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Filter vaults"
                    className="pl-10 bg-transparent border-[#25333b] rounded-lg h-10 text-white placeholder-gray-400 focus:border-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            {usersParticipatedCampaigns.length > 0 ? (
              <div className="rounded-lg">
                {/* Table header */}
                <div className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700 text-gray-400/70 text-xs bg-[#19242a] mb-4 rounded-t-2xl">
                  <div>Campaign</div>
                  <div>Amount</div>
                  <div className="flex items-center space-x-1">
                    <span>Creator</span>
                    <ArrowDown className="h-3 w-3" />
                  </div>
                  <div>Status</div>
                  <div>Indulge</div>
                </div>

                <div className="space-y-3">
                  {!usersParticipatedCampaigns
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton className="h-20 bg-[#0F0F0F]/50 w-full rounded-2xl" key={i} />
                      ))
                    : usersParticipatedCampaigns
                        ?.reverse()
                        .map(campaign => <TableRow key={campaign.id} campaign={campaign} />)}
                </div>
              </div>
            ) : (
              <Card className="bg-[#19242a] border-[#3e545f] h-64">
                <div className="flex items-center justify-center w-full h-full">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-16 w-16 rounded-full flex justify-center items-center bg-gray-700 text-gray-300">
                      <BrushCleaning size={27} />
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="font-medium text-lg text-gray-300">No campaign found</div>
                      <div className="text-gray-500 text-xs">Explore campaigns on Very Network to get started.</div>
                    </div>

                    <div>
                      <Link
                        href="/app/explore"
                        className="text-white hover:text-white flex items-center justify-center bg-[#FF6B7A] hover:bg-[#FF8B7A] h-10 w-40 rounded-lg font-semibold transition-colors"
                      >
                        Explore
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
