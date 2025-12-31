import React from "react";
import Link from "next/link";
import { View } from "lucide-react";
import { Address } from "~~/components/scaffold-eth";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { formatAmount } from "~~/lib/utils";
import { ICampaign } from "~~/types/interface";

interface TableRowProps {
  campaign: ICampaign;
}

const TableRow: React.FC<TableRowProps> = ({ campaign }) => {
  return (
    <>
      <Link
        href={`/app/campaign/${campaign.id}`}
        className="hidden sm:grid grid-cols-5 gap-4 px-4 py-5 items-center hover:bg-gray-800/50 transition-colors text-sm bg-[#19242a] rounded-xl"
      >
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-[#FF6B7A]/20 border border-[#FF6B7A]/30 rounded-full flex items-center justify-center">
            <span className="text-[#FF6B7A] text-xs font-semibold">{campaign.symbol.slice(0, 2)}</span>
          </div>
          <span className="text-white">{campaign.name}</span>
        </div>

        <div className="space-y-1">
          <div className="text-white">{formatAmount(campaign.amountRaised)} WVERY</div>
          <div className="text-gray-400 text-xs">
            {formatAmount(campaign.tokensSold)}/{formatAmount(campaign.tokensForSale)}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Address address={campaign.creator} size="sm" />
        </div>

        <div className="w-[35%]">
          {campaign.isActive && (
            <Badge className="bg-green-700/30 inline-flex items-center gap-2 py-1 px-2 w-full">Active</Badge>
          )}
          {campaign.isFundingComplete && (
            <Badge className="bg-blue-700/30 inline-flex items-center gap-3 py-1 px-2 w-full">
              Live
              <Badge className="h-3 min-w-3 rounded-full px-1 font-mono tabular-nums bg-blue-700 animate-pulse"></Badge>
            </Badge>
          )}
          {campaign.isCancelled && (
            <Badge className="bg-red-700/30 inline-flex items-center gap-2 py-1 px-2 w-full">Cancelled</Badge>
          )}
        </div>

        <div>
          <Button className="bg-[#FF6B7A] hover:bg-[#FF8B7A] rounded-3xl flex items-center gap-3 text-white">
            View
            <View className="h-4 w-4" />
          </Button>
        </div>
      </Link>

      <Link
        href={`/app/campaign/${campaign.id}`}
        // On large screens, `w-full` ensures the row takes up all available width.
        // `flex flex-nowrap` keeps all items in a single row.
        // `overflow-x-auto` enables horizontal scrolling when the combined minimum width of children exceeds the parent's width.
        // The `gap-4` provides consistent spacing between columns.
        className="flex flex-nowrap w-full gap-4 px-4 py-5 items-center hover:bg-gray-800/50 transition-colors text-sm bg-[#19242a] rounded-xl overflow-x-auto sm:hidden"
      >
        {/* Campaign Name: `flex-shrink-0` prevents shrinking, `min-w-[180px]` ensures a minimum width. */}
        <div className="flex items-center space-x-3 flex-shrink-0 min-w-[180px]">
          <div className="h-8 w-8 bg-[#FF6B7A]/20 border border-[#FF6B7A]/30 rounded-full flex items-center justify-center">
            <span className="text-[#FF6B7A] text-xs font-semibold">{campaign.symbol.slice(0, 2)}</span>
          </div>
          <span className="text-white">{campaign.name}</span>
        </div>

        {/* Amount: `flex-shrink-0` prevents shrinking, `min-w-[150px]` ensures a minimum width. */}
        <div className="space-y-1 flex-shrink-0 min-w-[150px]">
          <div className="text-white">{formatAmount(campaign.amountRaised)} USDC</div>
          <div className="text-gray-400 text-xs">
            {formatAmount(campaign.tokensSold)}/{formatAmount(campaign.tokensForSale)}
          </div>
        </div>

        {/* Creator: `flex-shrink-0` prevents shrinking, `min-w-[180px]` ensures a minimum width for the Address component. */}
        <div className="flex items-center space-x-2 flex-shrink-0 min-w-[180px]">
          <Address address={campaign.creator} size="sm" />
        </div>

        {/* Status: `flex-shrink-0` prevents shrinking, `min-w-[120px]` ensures a minimum width. */}
        <div className="flex-shrink-0 min-w-[120px]">
          {campaign.isActive && (
            <Badge className="bg-green-700/30 inline-flex items-center gap-2 py-1 px-2 w-full">Active</Badge>
          )}
          {campaign.isFundingComplete && (
            <Badge className="bg-blue-700/30 inline-flex items-center gap-3 py-1 px-2 w-full">
              Live
              <Badge className="h-3 min-w-3 rounded-full px-1 font-mono tabular-nums bg-blue-700 animate-pulse"></Badge>
            </Badge>
          )}
          {campaign.isCancelled && (
            <Badge className="bg-red-700/30 inline-flex items-center gap-2 py-1 px-2 w-full">Cancelled</Badge>
          )}
        </div>

        {/* Indulge Button: `flex-shrink-0` prevents shrinking, `min-w-[100px]` ensures a minimum width. */}
        <div className="flex-shrink-0 min-w-[100px]">
          <Button className="bg-[#FF6B7A] hover:bg-[#FF8B7A] rounded-3xl flex items-center gap-3 text-white">
            View
            <View className="h-4 w-4" />
          </Button>
        </div>
      </Link>
    </>
  );
};

export default TableRow;
