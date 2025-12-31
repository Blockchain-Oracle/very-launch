import { ChevronDown } from "lucide-react";
import { Button } from "~~/components/ui/button";
import { Card } from "~~/components/ui/card";

export function OverviewTab({
  amountRaised,
  isLive,
  poolPrice,
}: {
  amountRaised: number;
  isLive: boolean;
  poolPrice: number;
}) {
  return (
    <div className="space-y-8">
      {/* Total Deposits Chart */}
      <div>
        {/* Chart Container */}
        <Card className="bg-[#11181C] border-[#24353d] px-3 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col items-start text-[#8daa98]">
              <h3 className="text-xs text-[#a4a6a4b0]">{!isLive ? "Total Deposits (USD)" : "Pool Price"}</h3>
              <div className="text-4xl font-light mb-6">
                ${!isLive ? amountRaised?.toFixed(2) || "0.00" : poolPrice?.toFixed(6) || "0.000000"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 bg-[#546054b0] rounded-2xl flex items-center gap-1"
              >
                3 months
                <ChevronDown className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="relative h-full hidden sm:block">
            {/* Simulated chart line */}
            <svg className="w-full h-full" viewBox="0 0 800 200">
              <path
                d="M 50 150 Q 200 140 350 145 Q 500 150 650 80 Q 700 60 750 50"
                stroke="#8daa98"
                strokeWidth="2"
                fill="none"
              />
              <circle cx="750" cy="50" r="4" fill="#3b82f6" />
            </svg>

            {/* Chart labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-400 px-4">
              <span>26 May</span>
              <span>2 Jun</span>
              <span>9 Jun</span>
              <span>16 Jun</span>
              <span>23 Jun</span>
              <span>30 Jun</span>
              <span>7 Jul</span>
              <span>14 Jul</span>
              <span>21 Jul</span>
              <span>28 Jul</span>
              <span>4 Aug</span>
              <span>11 Aug</span>
              <span>18 Aug</span>
            </div>

            {/* Value labels */}
            <div className="absolute right-4 top-4 text-sm text-gray-400">$300.00M</div>
            <div className="absolute right-4 bottom-16 text-sm text-gray-400">$200.00M</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
