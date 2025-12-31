"use client";

import { useEffect, useState } from "react";
import { SlippageSettings } from "./slippage-settings";
import { TokenSelector } from "./token-selector";
import { TransactionModal } from "./transaction-modal";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpDown, ChevronDown, Info, Loader2, Settings } from "lucide-react";
import { NumericFormat } from "react-number-format";
import { formatEther, parseEther } from "viem";
import { useAccount, useBalance } from "wagmi";
import { Button } from "~~/components/ui/button";
import { Card, CardContent } from "~~/components/ui/card";
import { useDeployedContractInfo, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface SwapCardProps {
  selectedCampaign?: any;
  onSelectCampaign?: (campaign: any) => void;
}

interface Token {
  symbol: string;
  address: string;
  name: string;
}

export function SwapCard({ selectedCampaign, onSelectCampaign }: SwapCardProps) {
  const { address: userAddress, isConnected } = useAccount();

  // Get contract addresses dynamically for current network
  const { data: wveryContract } = useDeployedContractInfo({ contractName: "WrappedVery" });
  // const { data: routerContract } = useDeployedContractInfo({ contractName: "BumdexRouter" });

  const WVERY_ADDRESS = wveryContract?.address;
  // const ROUTER_ADDRESS = routerContract?.address; // Unused for now

  const [fromToken, setFromToken] = useState<Token>({
    symbol: "WVERY",
    address: WVERY_ADDRESS || "",
    name: "Wrapped Very",
  });
  const [toToken, setToToken] = useState<Token | undefined>(undefined);
  const [inputAmount, setInputAmount] = useState("");
  const [outputAmount, setOutputAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [showTokenSelector, setShowTokenSelector] = useState<"from" | "to" | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [exchangeRate, setExchangeRate] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Get balances
  const { data: fromBalance } = useBalance({
    address: userAddress,
    token: fromToken?.address as `0x${string}`,
  });

  const { data: toBalance } = useBalance({
    address: userAddress,
    token: toToken?.address as `0x${string}`,
  });

  // Get swap quote from router
  const { data: swapQuote } = useScaffoldReadContract({
    contractName: "BumdexRouter",
    functionName: "getAmountsOut",
    args: [
      inputAmount ? parseEther(inputAmount) : BigInt(0),
      [fromToken.address, toToken?.address || WVERY_ADDRESS || ""],
    ],
  });

  // Write contracts
  // const { writeContractAsync: approveToken } = useScaffoldWriteContract("WrappedVery"); // Unused for now
  const { writeContractAsync: executeSwap } = useScaffoldWriteContract("BumdexRouter");

  // Update fromToken address when WVERY contract loads
  useEffect(() => {
    if (WVERY_ADDRESS && fromToken.symbol === "WVERY") {
      setFromToken(prev => ({ ...prev, address: WVERY_ADDRESS }));
    }
  }, [WVERY_ADDRESS]);

  // Update output amount when input changes
  useEffect(() => {
    if (swapQuote && swapQuote[1]) {
      const output = formatEther(swapQuote[1]);
      setOutputAmount(Number(output).toFixed(6));

      // Calculate exchange rate
      if (inputAmount && Number(inputAmount) > 0) {
        setExchangeRate(Number(output) / Number(inputAmount));
      }
    }
  }, [swapQuote, inputAmount]);

  // Update selected campaign
  useEffect(() => {
    if (selectedCampaign) {
      setToToken({
        symbol: selectedCampaign.symbol,
        address: selectedCampaign.token,
        name: selectedCampaign.name,
      });
    }
  }, [selectedCampaign]);

  const handleFlip = () => {
    const temp = fromToken;
    setFromToken(toToken || { symbol: "WVERY", address: WVERY_ADDRESS || "", name: "Wrapped Very" });
    setToToken(temp);
    setInputAmount("");
    setOutputAmount("");
  };

  const handleSwap = async () => {
    if (!userAddress || !inputAmount || !toToken) return;

    setIsSwapping(true);
    try {
      const minOutput = BigInt(Math.floor(Number(outputAmount) * (1 - slippage / 100) * 1e18));
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 minutes

      const tx = await executeSwap({
        functionName: "swapExactTokensForTokens",
        args: [parseEther(inputAmount), minOutput, [fromToken.address, toToken.address], userAddress, deadline],
      });

      setTransactionHash(tx || "");
      setShowTransactionModal(true);
      notification.success("Swap successful!");

      // Reset form
      setInputAmount("");
      setOutputAmount("");
    } catch (error) {
      console.error("Swap failed:", error);
      notification.error("Swap failed. Please try again.");
    } finally {
      setIsSwapping(false);
    }
  };

  const isInsufficientBalance = inputAmount && fromBalance && Number(inputAmount) > Number(fromBalance.formatted);
  const canSwap = isConnected && inputAmount && toToken && !isInsufficientBalance;

  return (
    <>
      <Card className="bg-gray-900/50 backdrop-blur-xl border-gray-800">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Swap</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          {/* From Section */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">From</label>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <NumericFormat
                  value={inputAmount}
                  onValueChange={values => setInputAmount(values.value)}
                  thousandSeparator=","
                  decimalScale={6}
                  placeholder="0.00"
                  className="bg-transparent text-2xl font-medium text-white outline-none w-full"
                  allowNegative={false}
                />
                <Button
                  variant="ghost"
                  onClick={() => setShowTokenSelector("from")}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 rounded-lg"
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-[#FF6B7A] to-[#FF8B7A] rounded-full" />
                  <span className="font-medium text-white">{fromToken.symbol}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  Balance: {fromBalance?.formatted || "0.00"} {fromToken.symbol}
                </span>
                {fromBalance && (
                  <button
                    onClick={() => setInputAmount(fromBalance.formatted)}
                    className="text-[#FF6B7A] hover:text-[#FF8B7A] font-medium"
                  >
                    MAX
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Flip Button */}
          <div className="flex justify-center -my-2 relative z-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95, rotate: 180 }}
              onClick={handleFlip}
              className="bg-gray-800 hover:bg-gray-700 border-4 border-gray-900 rounded-xl p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowUpDown className="h-5 w-5" />
            </motion.button>
          </div>

          {/* To Section */}
          <div className="space-y-2 mt-4">
            <label className="text-sm text-gray-400">To</label>
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <input
                  value={outputAmount}
                  readOnly
                  placeholder="0.00"
                  className="bg-transparent text-2xl font-medium text-white outline-none w-full"
                />
                <Button
                  variant="ghost"
                  onClick={() => setShowTokenSelector("to")}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 rounded-lg"
                >
                  {toToken ? (
                    <>
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full" />
                      <span className="font-medium text-white">{toToken.symbol}</span>
                    </>
                  ) : (
                    <span className="font-medium text-gray-400">Select token</span>
                  )}
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
              {toToken && (
                <div className="text-sm text-gray-400">
                  Balance: {toBalance?.formatted || "0.00"} {toToken.symbol}
                </div>
              )}
            </div>
          </div>

          {/* Exchange Rate */}
          {inputAmount && outputAmount && toToken && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Exchange Rate</span>
                <span className="text-white">
                  1 {fromToken.symbol} = {exchangeRate.toFixed(4)} {toToken.symbol}
                </span>
              </div>
            </div>
          )}

          {/* Details Section */}
          <AnimatePresence>
            {inputAmount && outputAmount && toToken && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-4"
              >
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                >
                  <Info className="h-4 w-4" />
                  Details
                  <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? "rotate-180" : ""}`} />
                </button>

                {showDetails && (
                  <div className="mt-3 p-3 bg-gray-800/30 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Minimum received</span>
                      <span className="text-white">
                        {(Number(outputAmount) * (1 - slippage / 100)).toFixed(4)} {toToken.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Slippage Tolerance</span>
                      <span className="text-white">{slippage}%</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Button */}
          <motion.div
            whileHover={{ scale: !canSwap ? 1 : 1.02 }}
            whileTap={{ scale: !canSwap ? 1 : 0.98 }}
            className="mt-6"
          >
            {!isConnected ? (
              <Button disabled className="w-full h-12 font-medium text-lg">
                Connect wallet above to continue
              </Button>
            ) : !inputAmount ? (
              <Button disabled className="w-full h-12 font-medium text-lg">
                Enter an amount
              </Button>
            ) : !toToken ? (
              <Button disabled className="w-full h-12 font-medium text-lg">
                Select a token
              </Button>
            ) : isInsufficientBalance ? (
              <Button disabled className="w-full h-12 font-medium text-lg">
                Insufficient {fromToken.symbol} balance
              </Button>
            ) : (
              <Button
                onClick={handleSwap}
                disabled={isSwapping || !canSwap}
                className="w-full h-12 bg-[#FF6B7A] hover:bg-[#FF8B7A] text-white font-medium text-lg"
              >
                {isSwapping ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Swapping...
                  </>
                ) : (
                  "Swap"
                )}
              </Button>
            )}
          </motion.div>
        </CardContent>
      </Card>

      {/* Modals */}
      <SlippageSettings
        open={showSettings}
        onOpenChange={setShowSettings}
        slippage={slippage}
        onSlippageChange={setSlippage}
      />

      <TokenSelector
        open={showTokenSelector !== null}
        onOpenChange={open => !open && setShowTokenSelector(null)}
        onSelectToken={token => {
          if (showTokenSelector === "from") {
            setFromToken(token);
          } else {
            setToToken(token);
            onSelectCampaign?.(token);
          }
          setShowTokenSelector(null);
        }}
        selectedToken={showTokenSelector === "from" ? fromToken : toToken}
        otherToken={showTokenSelector === "from" ? toToken : fromToken}
      />

      <TransactionModal
        open={showTransactionModal}
        onOpenChange={setShowTransactionModal}
        transactionHash={transactionHash}
      />
    </>
  );
}
