"use client";

import Link from "next/link";
import { Check } from "lucide-react";

export function PricingSection() {
  const pricingPlans = [
    {
      name: "Creators",
      description:
        "Launch your token the smart way — with built-in mechanics that create trust, build momentum, and ensure liquidity from day one.",
      annualPrice: "Free For Creators",
      features: [
        "Easy Campaign Creation",
        "Bancor-Style Bonding Curve",
        "Instant Liquidity Deployment",
        "Attract Attention with Sponsorships",
        "Creator Allocation",
        "Lifetime Trading Ecosystem",
      ],
      buttonText: "Get Started 🧧",
      urlRouteTo: "/app",
      buttonClass:
        "bg-[#FF6B7A] shadow-[0px_1px_1px_-0.5px_rgba(16,24,40,0.20)] text-white hover:bg-[#FF8B7A] transition-colors",
    },

    {
      name: "Buyers",
      description:
        "Support early-stage tokens with confidence — and be rewarded for getting in early. No stress, easy peasy",
      annualPrice: "Free For Buyers",
      features: [
        "Early Buyer Rewards",
        "OG Point Accumulation",
        "Refunds If Things Go South",
        "Instant Trading",
        "Passive Earnings via LP",
        "Portfolio Overview",
      ],
      buttonText: "Explore 🚀",
      urlRouteTo: "/app/explore",
      buttonClass:
        "bg-[#FF6B7A] shadow-[0px_1px_1px_-0.5px_rgba(16,24,40,0.20)] text-white hover:bg-[#FF8B7A] transition-colors",
    },
  ];

  return (
    <section className="w-full sm:px-5 overflow-hidden sm:m-2 sm:rounded-2xl py-8 md:py-14 bg-gradient-to-br from-[#1A1A1A] via-[#FF6B7A]/8 to-[#1A1A1A]">
      <div className="self-stretch relative flex flex-col justify-center items-center gap-4 py-0">
        <div className="flex flex-col justify-start items-center gap-4">
          <div
            className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 backdrop-blur-sm mb-4 relative"
            style={{
              filter: "url(#glass-effect)",
            }}
          >
            <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-b from-[#FF6B7A]/10 to-transparent rounded-full" />
            <span className="text-white/90 text-xs font-light relative z-10">✨ For Creators, For buyers</span>
          </div>
          <h2 className="text-center text-foreground text-4xl md:text-5xl font-semibold leading-tight md:leading-[40px]">
            Something For Everyone.
          </h2>
          <p className="max-w-xl sm:max-w-2xl text-center text-muted-foreground font-light leading-tight px-2 sm:px-0">
            Whether you&apos;re a builder launching your vision or a backer hunting for early gems, VeryLaunch delivers
            the tools, safety, and incentives to make your journey profitable and secure.
          </p>
        </div>
      </div>
      <div className="self-stretch px-5 flex flex-col md:flex-row justify-start items-start gap-6 md:gap-6 mt-14 mx-auto max-w-3xl">
        {pricingPlans.map(plan => (
          <div
            key={plan.name}
            className={`flex-1 p-4 overflow-hidden rounded-xl flex flex-col justify-start items-start gap-6 bg-gradient-to-b from-gray-50/5 to-gray-50/0 w-full`}
            style={{ outline: "1px solid hsl(var(--border))", outlineOffset: "-1px" }}
          >
            <div className="self-stretch flex flex-col justify-start items-start gap-6">
              <div className="self-stretch flex flex-col justify-start items-start gap-5">
                <div className={`w-full h-5 text-sm font-medium leading-tight text-zinc-200`}>{plan.name}</div>
                <div className="self-stretch flex flex-col justify-start items-start gap-1">
                  <div className="flex justify-start items-center gap-1.5">
                    <div className={`h-10 flex items-center text-3xl font-medium leading-10 text-zinc-50 mb-3`}>
                      {plan.annualPrice}
                    </div>
                  </div>
                  <div className={`self-stretch text-sm font-medium leading-tight text-zinc-400`}>
                    {plan.description}
                  </div>
                </div>
              </div>
              <Link
                href={plan.urlRouteTo}
                className={`self-stretch px-5 py-2 rounded-[40px] flex justify-center items-center ${plan.buttonClass}`}
              >
                <div className="px-1.5 flex justify-center items-center gap-2">
                  <span
                    className={`text-center text-sm font-medium leading-tight ${plan.name === "Free" ? "text-gray-800" : plan.name === "Pro" ? "text-primary" : "text-zinc-950"}`}
                  >
                    {plan.buttonText}
                  </span>
                </div>
              </Link>
            </div>

            <div className="self-stretch flex flex-col justify-start items-start gap-4">
              <div className="self-stretch flex flex-col justify-start items-start gap-3">
                {plan.features.map(feature => (
                  <div key={feature} className="self-stretch flex justify-start items-center gap-2">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <Check className={`w-full h-full text-muted-foreground`} strokeWidth={2} />
                    </div>
                    <div className={`leading-tight font-normal text-sm text-left text-muted-foreground"}`}>
                      {feature}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
