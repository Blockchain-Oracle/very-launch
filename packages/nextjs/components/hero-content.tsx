"use client";

import Link from "next/link";
import GlobalStatsCard from "./global-stats-card";

export default function HeroContent() {
  return (
    <main className="flex flex-col flex-1 justify-between">
      <div className="sm:flex w-full justify-end pt-7 pr-8 z-20 hidden">
        <GlobalStatsCard />
      </div>
      <div className="absolute bottom-12 left-4 sm:left-8 z-20 max-w-lg sm:max-w-xl">
        <div className="text-left pr-3">
          <div
            className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm mb-4 relative"
            style={{
              filter: "url(#glass-effect)",
            }}
          >
            <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
            <span className="text-white/90 text-xs font-light relative z-10">✨ Launch. Trade. Thrive.</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl md:leading-16 tracking-tight font-light text-white mb-4">
            The <span className="font-medium italic instrument">fairest</span> launchpad on Very Network. 🚀
          </h1>

          {/* Description */}
          <p className="text-xs font-light text-white/70 mb-4 leading-relaxed">
            No more rug-pulls or illiquid tokens — every successful campaign automatically deploys liquidity on Very
            Network. Early movers win with better prices, creators secure fair funding, and everyone&apos;s protected by
            built-in refunds.
          </p>

          {/* Buttons */}
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href={"/app/explore"}
              className="px-8 py-3 rounded-full bg-transparent border border-white/30 text-white font-normal text-xs transition-all duration-200 hover:bg-white/10 hover:border-white/50 cursor-pointer"
            >
              Explore
            </Link>
            <Link
              href={"/app"}
              className="px-8 py-3 rounded-full bg-[#FF6B7A] text-white font-normal text-xs transition-all duration-200 hover:bg-[#FF8B7A] cursor-pointer"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
