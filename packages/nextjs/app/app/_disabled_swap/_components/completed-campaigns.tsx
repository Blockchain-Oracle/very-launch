"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Search } from "lucide-react";
import { formatUnits } from "viem";
import { Badge } from "~~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/card";
import { Input } from "~~/components/ui/input";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface CompletedCampaignsProps {
  selectedCampaign?: any;
  onSelectCampaign?: (campaign: any) => void;
}

export function CompletedCampaigns({ selectedCampaign, onSelectCampaign }: CompletedCampaignsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCampaigns, setFilteredCampaigns] = useState<any[]>([]);

  // Fetch all campaigns using LaunchpadV2's getAllCampaignsPaginated
  const { data: campaignData } = useScaffoldReadContract({
    contractName: "LaunchpadV2",
    functionName: "getAllCampaignsPaginated",
    args: [0, 50], // offset: 0, limit: 50
  });

  // Extract campaigns array from the result tuple [campaigns[], total, hasMore]
  const campaigns = campaignData?.[0] || [];

  // Filter completed campaigns with liquidity pools
  useEffect(() => {
    if (campaigns && campaigns.length > 0) {
      console.log("All campaigns from contract:", campaigns);
      const completed = campaigns.filter(
        (campaign: any) =>
          campaign.isFundingComplete && campaign.uniswapPair !== "0x0000000000000000000000000000000000000000",
      );
      console.log("Completed campaigns with pools:", completed);

      // Apply search filter
      let filtered = completed;
      if (searchQuery) {
        filtered = completed.filter(
          (campaign: any) =>
            campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            campaign.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      }

      // Sort by recent (original order from contract)
      // Note: Future enhancement - add on-chain volume/liquidity tracking

      setFilteredCampaigns(filtered);
    }
  }, [campaigns, searchQuery]);

  const getTokenColor = (address: string) => {
    // Generate consistent color from address
    const hash = address.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      "from-blue-400 to-purple-400",
      "from-green-400 to-teal-400",
      "from-yellow-400 to-orange-400",
      "from-pink-400 to-rose-400",
      "from-indigo-400 to-blue-400",
    ];
    return colors[hash % colors.length];
  };

  return (
    <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
      <CardHeader>
        <CardTitle className="text-xl text-white flex items-center justify-between">
          <span>Tradeable Tokens</span>
          <Badge variant="outline" className="text-xs">
            {filteredCampaigns.length} Available
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-400"
          />
        </div>

        {/* Campaign List */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {filteredCampaigns.map((campaign, index) => (
              <motion.div
                key={campaign.token}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectCampaign?.(campaign)}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedCampaign?.token === campaign.token
                    ? "bg-[#FF6B7A]/10 border-[#FF6B7A]/30"
                    : "bg-gray-800/30 border-gray-700 hover:bg-gray-800/50 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {/* Token Logo */}
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${getTokenColor(campaign.token)} flex items-center justify-center text-white font-bold text-sm`}
                    >
                      {campaign.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <div className="font-medium text-white">{campaign.name}</div>
                      <div className="text-sm text-gray-400">{campaign.symbol}</div>
                    </div>
                  </div>
                </div>

                {/* Raised Progress Bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Raised</span>
                    <span>
                      {Number(formatUnits(campaign.amountRaised, 6)).toFixed(0)} /
                      {Number(formatUnits(campaign.targetAmount, 6)).toFixed(0)} WVERY
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-[#FF6B7A] to-[#FF8B7A] h-1.5 rounded-full"
                      style={{
                        width: `${(Number(campaign.amountRaised) / Number(campaign.targetAmount)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredCampaigns.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                {searchQuery ? "No tokens found matching your search" : "No tradeable tokens available yet"}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
