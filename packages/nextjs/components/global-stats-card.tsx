"use client";

import Link from "next/link";
import { useSummaryStats } from "~~/hooks/use-fetch-global-stats";
import { formatAmount } from "~~/lib/utils";

export default function GlobalStatsCard() {
  const { data } = useSummaryStats();

  return (
    <div className="max-w-sm ml-auto">
      <div className="bg-white/20 bg-blend-luminosity  rounded-2xl p-4 shadow-sm">
        <div className="bg-[#25333b]/70 rounded-2xl p-6 mb-6 shadow-xl transform hover:scale-[1.02] transition-transform duration-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="flex flex-col">
              <span className="text-md font-semibold text-white mb-1">
                ${formatAmount(data?.totalFundingRaised || 0)}
              </span>
              <span className="text-gray-400 text-xs">Total Raised</span>
            </div>
            <div className="flex flex-col">
              <span className="text-md font-semibold text-white mb-1">{data?.totalCampaigns || 0}</span>
              <span className="text-gray-400 text-xs">Total Campaigns</span>
            </div>
            <div className="flex flex-col">
              <span className="text-md font-semibold text-white mb-1">{data?.activeCampaigns || 0}</span>
              <span className="text-gray-400 text-xs">Active Campaigns</span>
            </div>
            <div className="flex flex-col">
              <span className="text-md font-semibold text-white mb-1">{data?.completedCampaigns || 0}</span>
              <span className="text-gray-400 text-xs">Live Pairs</span>
            </div>
          </div>
        </div>

        <div className="text-center mb-4 text-xs">
          <p className="text-gray-100">
            VeryLaunch stats reflect our commitment to fair token launches and the success of creators building on Very
            Network.
          </p>
        </div>

        <div className="flex justify-center">
          <Link
            href="/app/explore"
            className="text-white hover:text-white flex items-center justify-center bg-[#25333b]/70 h-12 w-40 rounded-3xl font-semibold"
          >
            Explore 🚀
          </Link>
        </div>
      </div>
    </div>
  );
}
