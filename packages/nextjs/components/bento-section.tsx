import React from "react";
import { FeaturesCard } from "./features-card";
import { veryLaunchFeatures } from "~~/lib/mock-data.ts/mock";

export function BentoSection() {
  return (
    <section className="w-full px-5 flex flex-col justify-center items-center overflow-visible bg-transparent">
      <div className="w-full py-8 md:py-16 relative flex flex-col justify-start items-start gap-6">
        <div className="w-[547px] h-[938px] absolute top-[614px] left-[80px] origin-top-left rotate-[-33.39deg] bg-primary/10 blur-[130px] z-0" />
        <div className="self-stretch py-8 md:py-14 flex flex-col justify-center items-center gap-2 z-10">
          <div className="flex flex-col justify-start items-center gap-4">
            <div
              className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm mb-4 relative"
              style={{
                filter: "url(#glass-effect)",
              }}
            >
              <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />
              <span className="text-white/90 text-xs font-light relative z-10">✨ Build Your Project Today</span>
            </div>
            <h2 className="w-full max-w-[655px text-center text-4xl md:text-6xl md:leading-16 tracking-tight font-normal text-white">
              From launchpad to liquidity pool <br /> — all on Very Network 💫
            </h2>
            <p className="w-full max-w-[600px] text-center text-muted-foreground text-sm font-extralight leading-relaxed">
              Instantly tradeable. Instantly liquid. From campaign to DEX in one seamless launch.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 z-10">
          {veryLaunchFeatures.map(feature => (
            <FeaturesCard feature={feature} key={feature.id} />
          ))}
        </div>
      </div>
    </section>
  );
}
