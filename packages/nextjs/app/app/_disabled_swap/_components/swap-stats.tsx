"use client";

import { motion } from "framer-motion";
import { ArrowLeftRight, Coins, Shield } from "lucide-react";
import { Card, CardContent } from "~~/components/ui/card";

export function SwapStats() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">How It Works</h3>

      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 p-2 flex items-center justify-center flex-shrink-0">
                <Coins className="h-full w-full text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Trade Campaign Tokens</h4>
                <p className="text-xs text-gray-400">Swap WVERY for tokens from completed campaigns or vice versa</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
        <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 p-2 flex items-center justify-center flex-shrink-0">
                <ArrowLeftRight className="h-full w-full text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Automated Liquidity</h4>
                <p className="text-xs text-gray-400">
                  Liquidity pools are created automatically when campaigns complete
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
        <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-400 p-2 flex items-center justify-center flex-shrink-0">
                <Shield className="h-full w-full text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Secure & Transparent</h4>
                <p className="text-xs text-gray-400">All swaps execute on-chain using battle-tested AMM protocols</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
