"use client";

import { Building2, CheckCircle2, Circle, Rocket, TrendingUp, Users, Zap } from "lucide-react";
import { Badge } from "~~/components/ui/badge";
import { Card } from "~~/components/ui/card";

interface RoadmapPhase {
  id: number;
  title: string;
  status: "completed" | "in-progress" | "planned";
  quarter: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
}

export default function RoadmapPage() {
  const roadmapPhases: RoadmapPhase[] = [
    {
      id: 1,
      title: "Foundation",
      status: "completed",
      quarter: "Q4 2024",
      description: "Core launchpad infrastructure with bonding curve token launches",
      features: [
        "Smart contract deployment (Launchpad, WrappedVery)",
        "Bonding curve token creation",
        "Campaign creation and funding",
        "Token distribution mechanism",
        "Web3 wallet integration",
      ],
      icon: <Rocket className="w-6 h-6 text-[#FF6B7A]" />,
    },
    {
      id: 2,
      title: "Enhanced Trading",
      status: "in-progress",
      quarter: "Q1 2025",
      description: "AMM integration with automated liquidity provision",
      features: [
        "Bumdex DEX integration (Uniswap V2 fork)",
        "Automated liquidity pool creation",
        "Token swapping functionality",
        "Pool metrics and analytics",
        "Price discovery mechanisms",
      ],
      icon: <TrendingUp className="w-6 h-6 text-[#FF6B7A]" />,
    },
    {
      id: 3,
      title: "DeFi Expansion",
      status: "planned",
      quarter: "Q2 2025",
      description: "Advanced DeFi features and yield opportunities",
      features: [
        "Staking and yield farming",
        "Liquidity mining rewards",
        "Multi-token pool support",
        "Cross-chain bridge integration",
        "Advanced trading features (limit orders, TWAP)",
      ],
      icon: <Zap className="w-6 h-6 text-gray-400" />,
    },
    {
      id: 4,
      title: "Community & Governance",
      status: "planned",
      quarter: "Q3 2025",
      description: "Decentralized governance and community features",
      features: [
        "DAO governance system",
        "Community voting on platform decisions",
        "Token-gated achievements and rewards",
        "Social features (comments, ratings)",
        "Campaign verification and badges",
      ],
      icon: <Users className="w-6 h-6 text-gray-400" />,
    },
    {
      id: 5,
      title: "Enterprise Features",
      status: "planned",
      quarter: "Q4 2025",
      description: "Professional tools for larger projects and institutions",
      features: [
        "White-label launchpad solutions",
        "Advanced analytics dashboard",
        "API for third-party integrations",
        "Institutional-grade security audits",
        "Compliance and KYC tools",
      ],
      icon: <Building2 className="w-6 h-6 text-gray-400" />,
    },
  ];

  const completedPhases = roadmapPhases.filter(p => p.status === "completed").length;
  const totalPhases = roadmapPhases.length;

  const getStatusBadge = (status: RoadmapPhase["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-[#FF6B7A]/20 text-[#FF6B7A] border-[#FF6B7A]/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "in-progress":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Circle className="w-3 h-3 mr-1 animate-pulse" />
            In Progress
          </Badge>
        );
      case "planned":
        return <Badge className="bg-gray-800 text-gray-400 border-gray-700">Planned</Badge>;
    }
  };

  return (
    <div className="p-1.5 space-y-8 bg-[#0F0F0F] m-2 sm:m-4 rounded-2xl">
      {/* Header Section */}
      <div className="w-full p-4 grid sm:grid-cols-2 items-center sm:px-5">
        <div className="flex flex-col items-start gap-2 sm:pl-8 order-2 sm:order-1">
          <h1 className="text-3xl sm:text-6xl font-medium font-stretch-normal">Platform Roadmap</h1>
          <p className="text-gray-400 text-sm">
            Building the future of decentralized token launches on Very Network. Track our progress as we deliver
            innovative features and expand the VeryLaunch ecosystem.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl px-4 py-3">
              <div className="text-2xl sm:text-3xl font-bold text-[#FF6B7A]">{completedPhases}</div>
              <div className="text-xs sm:text-sm text-gray-400">Completed</div>
            </div>
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-xl px-4 py-3">
              <div className="text-2xl sm:text-3xl font-bold text-white">{totalPhases}</div>
              <div className="text-xs sm:text-sm text-gray-400">Total Phases</div>
            </div>
          </div>
        </div>

        <div className="order-1 sm:order-2 flex justify-center sm:justify-end">
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-[#FF6B7A]/20 flex items-center justify-center">
            <Rocket className="w-16 h-16 sm:w-20 sm:h-20 text-[#FF6B7A]" />
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="space-y-6 bg-[#1A1A1A] p-3 sm:p-6 rounded-2xl border border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-sm sm:text-base text-gray-300">Development Progress</span>
          <span className="text-sm sm:text-base text-gray-400">
            {Math.round((completedPhases / totalPhases) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className="bg-[#FF6B7A] h-2 rounded-full transition-all duration-500"
            style={{ width: `${(completedPhases / totalPhases) * 100}%` }}
          />
        </div>
      </div>

      {/* Roadmap Timeline */}
      <div className="space-y-6 bg-[#1A1A1A] p-3 sm:p-6 rounded-2xl border border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-semibold text-white">Development Phases</h2>
        </div>

        <div className="space-y-4">
          {roadmapPhases.map((phase, index) => (
            <Card
              key={phase.id}
              className={`bg-[#0F0F0F] border ${
                phase.status === "completed"
                  ? "border-[#FF6B7A]/50"
                  : phase.status === "in-progress"
                    ? "border-blue-500/50"
                    : "border-gray-800"
              } rounded-xl p-4 sm:p-6 hover:border-[#FF6B7A]/30 transition-all`}
            >
              <div className="flex items-start gap-4">
                {/* Timeline Indicator */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center ${
                      phase.status === "completed"
                        ? "bg-[#FF6B7A]/20"
                        : phase.status === "in-progress"
                          ? "bg-blue-500/20"
                          : "bg-gray-800"
                    }`}
                  >
                    {phase.icon}
                  </div>
                  {index < roadmapPhases.length - 1 && (
                    <div
                      className={`w-0.5 h-16 mt-2 ${phase.status === "completed" ? "bg-[#FF6B7A]/30" : "bg-gray-800"}`}
                    />
                  )}
                </div>

                {/* Phase Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-white">{phase.title}</h3>
                      <p className="text-sm text-gray-500">{phase.quarter}</p>
                    </div>
                    {getStatusBadge(phase.status)}
                  </div>

                  <p className="text-gray-400 text-sm sm:text-base mb-4">{phase.description}</p>

                  {/* Features List */}
                  <div className="bg-[#1A1A1A] rounded-lg p-3 border border-gray-800">
                    <div className="text-xs text-gray-500 mb-2 font-semibold">Key Features</div>
                    <div className="space-y-1.5">
                      {phase.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle2
                            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              phase.status === "completed" ? "text-[#FF6B7A]" : "text-gray-600"
                            }`}
                          />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Vision Section */}
      <div className="space-y-6 bg-[#1A1A1A] p-3 sm:p-6 rounded-2xl border border-[#FF6B7A]/30">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#FF6B7A]/20 flex items-center justify-center flex-shrink-0">
            <Rocket className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF6B7A]" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Our Vision</h3>
            <p className="text-gray-400 text-sm sm:text-base mb-4">
              VeryLaunch is building the most comprehensive token launch platform on Very Network. We combine bonding
              curve price discovery with automated liquidity provision to create a seamless experience for both project
              creators and token buyers.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-[#FF6B7A]" />
                <span>Fair launch mechanisms with transparent pricing</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-[#FF6B7A]" />
                <span>Automated liquidity for instant tradability</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle2 className="w-4 h-4 text-[#FF6B7A]" />
                <span>Community-driven development and governance</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
