import { ChevronDown } from "lucide-react";
import { useAccount, useReadContract } from "wagmi";
import { Badge } from "~~/components/ui/badge";
import { Button } from "~~/components/ui/button";
import { Card } from "~~/components/ui/card";
import { formatAmount } from "~~/lib/utils";
import { ICampaign } from "~~/types/interface";

export function YourPositionTab({ userPosition, campaign }: { userPosition: number; campaign: ICampaign | undefined }) {
  const { address: connectedAddress } = useAccount();
  const erc20Abi = [
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "value", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      constant: true,
      inputs: [{ name: "_owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "balance", type: "uint256" }],
      payable: false,
      stateMutability: "view",
      type: "function",
    },
  ];

  const tokenBalance = useReadContract({
    abi: erc20Abi,
    address: campaign?.tokenAddress,
    functionName: "balanceOf",
    args: [connectedAddress || ""],
  });

  const formattedTokenAmount = Number(tokenBalance.data ?? 0n) / 10 ** 18;

  return (
    <div className="space-y-8">
      {/* My Deposit Section */}
      <div>
        {/* Empty Chart */}
        <Card className="bg-[#11181C] border-[#24353d] px-3 py-5 sm:p-6 h-80">
          <div className="flex justify-between items-center">
            {campaign?.isFundingComplete ? (
              <div className="flex flex-col items-start text-[#8daa98]">
                <h3 className="text-xs text-[#a4a6a4b0]">Your Holdings</h3>
                <div className="text-4xl font-light mb-6">
                  ${formatAmount(formattedTokenAmount)} {campaign.symbol}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-start text-[#8daa98]">
                <h3 className="text-xs text-[#a4a6a4b0]">Your Deposits (USD)</h3>
                <div className="text-4xl font-light mb-6">${formatAmount(userPosition)} WVERY</div>
              </div>
            )}

            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="bg-[#546054b0] text-white">
                USD
              </Badge>
              <Button variant="ghost" size="sm" className="text-gray-400 flex items-center gap-1 hover:bg-transparent">
                3 months
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="border border-[#546054b0] rounded-lg h-36">
            <div className="h-full flex flex-col items-end justify-center">
              <div className="w-full h-0.5 bg-[#8daa98] rounded-t"></div>
              <div className="text-right text-[#546054b0] text-sm px-2 py-3 ml-auto">0</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
