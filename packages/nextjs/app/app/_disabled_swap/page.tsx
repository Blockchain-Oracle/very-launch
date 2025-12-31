"use client";

import { useState } from "react";
import { CompletedCampaigns } from "./_components/completed-campaigns";
import { SwapCard } from "./_components/swap-card";
import { motion } from "framer-motion";

export default function SwapPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  return (
    <main className="min-h-screen relative">
      <div className="p-1.5 space-y-8 bg-[#070907] m-2 sm:m-4 rounded-2xl">
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">
              Swap Tokens
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Trade your campaign tokens with WVERY using automated market maker pools
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6 pb-20 max-w-5xl mx-auto">
            {/* Swap Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-1"
            >
              <SwapCard selectedCampaign={selectedCampaign} onSelectCampaign={setSelectedCampaign} />
            </motion.div>

            {/* Completed Campaigns */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-1"
            >
              <CompletedCampaigns selectedCampaign={selectedCampaign} onSelectCampaign={setSelectedCampaign} />
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
