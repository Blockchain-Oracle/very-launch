"use client";

import { useEffect, useState } from "react";
import { Check, Info, Search } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~~/components/ui/dialog";
import { Input } from "~~/components/ui/input";
import { ScrollArea } from "~~/components/ui/scroll-area";

const WVERY_ADDRESS = "0x1291Be112d480055DaFd8a610b7d1e203891C274" as const;

interface Token {
  symbol: string;
  address: string;
  name: string;
  balance?: string;
  logo?: string;
}

interface TokenSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectToken: (token: Token) => void;
  selectedToken?: Token;
  otherToken?: Token;
}

export function TokenSelector({ open, onOpenChange, onSelectToken, selectedToken, otherToken }: TokenSelectorProps) {
  const { address: userAddress } = useAccount();
  const [searchQuery, setSearchQuery] = useState("");
  const [tokens, setTokens] = useState<Token[]>([]);

  // Get WVERY balance
  const { data: wveryBalance } = useBalance({
    address: userAddress,
    token: WVERY_ADDRESS,
  });

  // Get all campaigns from the contract - DISABLED
  // const { data: campaigns } = useScaffoldReadContract({
  //   contractName: "Launchpad",
  //   functionName: "getAllCampaigns",
  // });

  // Process campaigns into token list
  useEffect(() => {
    const tokenList: Token[] = [
      {
        symbol: "WVERY",
        address: WVERY_ADDRESS,
        name: "Wrapped Very",
        balance: wveryBalance?.formatted || "0",
        logo: "very",
      },
    ];

    // Disabled for now
    // if (campaigns) {
    //   const completedCampaigns = campaigns
    //     .filter(
    //       (campaign: any) =>
    //         campaign.isFundingComplete && campaign.uniswapPair !== "0x0000000000000000000000000000000000000000",
    //     )
    //     .map((campaign: any) => ({
    //       symbol: campaign.symbol,
    //       address: campaign.token,
    //       name: campaign.name,
    //       balance: "0", // TODO: Fetch actual balance
    //       logo: null,
    //     }));

    //   tokenList.push(...completedCampaigns);
    // }

    // Apply search filter
    if (searchQuery) {
      const filtered = tokenList.filter(
        token =>
          token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          token.address.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setTokens(filtered);
    } else {
      setTokens(tokenList);
    }
  }, [searchQuery, wveryBalance]);

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

  const handleSelectToken = (token: Token) => {
    // Don't allow selecting the same token on both sides
    if (otherToken?.address === token.address) return;

    onSelectToken(token);
    onOpenChange(false);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Select a Token</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, symbol, or address"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
              autoFocus
            />
          </div>

          {/* Common Tokens */}
          {!searchQuery && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-2">Common tokens</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectToken(tokens[0])} // WVERY
                  className="px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <div className="w-5 h-5 bg-gradient-to-br from-[#FF6B7A] to-[#FF8B7A] rounded-full" />
                  <span className="text-sm font-medium">WVERY</span>
                </button>
              </div>
            </div>
          )}

          {/* Token List */}
          <ScrollArea className="h-[350px] -mx-2 px-2">
            <div className="space-y-1">
              {tokens.map(token => {
                const isSelected = selectedToken?.address === token.address;
                const isDisabled = otherToken?.address === token.address;

                return (
                  <button
                    key={token.address}
                    onClick={() => handleSelectToken(token)}
                    disabled={isDisabled}
                    className={`w-full p-3 rounded-lg transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-[#FF6B7A]/20 border border-[#FF6B7A]/30"
                        : isDisabled
                          ? "bg-gray-800/20 cursor-not-allowed opacity-50"
                          : "bg-gray-800/30 hover:bg-gray-800/50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Token Logo */}
                      {token.logo === "very" ? (
                        <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B7A] to-[#FF8B7A] rounded-full" />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${getTokenColor(token.address)} flex items-center justify-center text-white font-bold text-sm`}
                        >
                          {token.symbol.slice(0, 3)}
                        </div>
                      )}

                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{token.symbol}</span>
                          {isSelected && <Check className="h-4 w-4 text-[#FF6B7A]" />}
                        </div>
                        <p className="text-sm text-gray-400">{token.name}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-white font-medium">{token.balance || "0"}</p>
                      {isDisabled && <p className="text-xs text-gray-500">Selected</p>}
                    </div>
                  </button>
                );
              })}

              {tokens.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Info className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No tokens found</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer Info */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center">{tokens.length} tokens available for trading</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
