"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { usePoolPrice } from "./utils/pool-price";
import { ArrowUpDown, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useAccount, useChainId, useReadContract, useWriteContract } from "wagmi";
import { Button } from "~~/components/ui/button";
import { Card } from "~~/components/ui/card";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useWepin } from "~~/hooks/useWepin";
import { formatAmount } from "~~/lib/utils";
import { ICampaign, IStakingPool } from "~~/types/interface";

export function BorrowInterface({
  campaign,
  stakingPool,
}: {
  campaign: ICampaign;
  stakingPool: IStakingPool | undefined;
}) {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  const { isConnected: wepinConnected, walletAddress: wepinAddress } = useWepin();

  // Use Wepin address if connected via Wepin, otherwise use wagmi address
  const connectedAddress = wepinConnected ? (wepinAddress as `0x${string}`) : wagmiAddress;
  const isConnected = wepinConnected || wagmiConnected;

  const [activeTab, setActiveTab] = useState<"trade" | "liquidity" | "stake">("trade");
  const [collateralAmount, setCollateralAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [stakeAmount, setStakeAmount] = useState<number>(0);

  const [swapFromAmount, setSwapFromAmount] = useState("");
  const [swapToAmount, setSwapToAmount] = useState("");
  const [swapDirection, setSwapDirection] = useState<"token-to-wvery" | "wvery-to-token">("token-to-wvery");

  const chainId = useChainId();
  const { writeContractAsync: approveAsync } = useWriteContract();
  const { writeContractAsync: writeYourContractAsync } = useScaffoldWriteContract({ contractName: "LaunchpadV2" });

  const contracts = deployedContracts[chainId as keyof typeof deployedContracts];
  const contractAddress = contracts && "LaunchpadV2" in contracts ? contracts.LaunchpadV2.address : "";
  const { currentPoolPrice, hasPoolData, reserves, token0, token1, wveryAddress } = usePoolPrice(campaign.uniswapPair);

  // Convert swap amounts to BigInt with proper decimal handling
  const swapFromAmountInWei =
    Number(swapFromAmount) > 0
      ? swapDirection === "wvery-to-token"
        ? BigInt(Math.floor(Number(swapFromAmount) * 10 ** 6)) // WVERY has 6 decimals
        : BigInt(Math.floor(Number(swapFromAmount) * 10 ** 18)) // Token has 18 decimals
      : 0n;

  // const swapToAmountInWei =
  //   Number(swapToAmount) > 0
  //     ? swapDirection === "wvery-to-token"
  //       ? BigInt(Math.floor(Number(swapToAmount) * 10 ** 18)) // Token has 18 decimals
  //       : BigInt(Math.floor(Number(swapToAmount) * 10 ** 6)) // WVERY has 6 decimals
  //     : 0n;

  // const amountToApprove = Number(swapFromAmountInWei) * 160;

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

  const approveToken = async (address: string, amount: bigint) => {
    try {
      await approveAsync({
        address: address,
        abi: erc20Abi,
        functionName: "approve",
        args: [contractAddress, amount],
      });
    } catch (e) {
      console.error("Approval error:", e);
    }
  };

  const handleCollateralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setCollateralAmount(value);
      // Auto-calculate equivalent WVERY amount based on pool ratio
      if (value && reserves && token0 && token1) {
        const tokenAmount = Number(value);
        const equivalentWVERY = calculateEquivalentWVERY(tokenAmount);
        setBorrowAmount(equivalentWVERY.toFixed(6));
      } else if (!value) {
        setBorrowAmount("");
      }
    }
  };

  const handleBorrowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setBorrowAmount(Number(value).toFixed(6));
      // Auto-calculate equivalent token amount based on pool ratio
      if (value && reserves && token0 && token1) {
        const usdcAmount = Number(value);
        const equivalentTokens = calculateEquivalentTokens(usdcAmount);
        setCollateralAmount(equivalentTokens.toString());
      } else if (!value) {
        setCollateralAmount("");
      }
    }
  };

  // Calculate equivalent amounts based on pool reserves
  const calculateEquivalentWVERY = (tokenAmount: number): number => {
    if (!reserves || !token0 || !token1) return 0;

    const [reserve0, reserve1] = reserves as [bigint, bigint, number];
    const isToken0WVERY = (token0 as string).toLowerCase() === wveryAddress.toLowerCase();

    let tokenReserve, wveryReserve;
    if (isToken0WVERY) {
      wveryReserve = Number(reserve0) / 10 ** 6; // WVERY has 6 decimals
      tokenReserve = Number(reserve1) / 10 ** 18; // Token has 18 decimals
    } else {
      tokenReserve = Number(reserve0) / 10 ** 18; // Token has 18 decimals
      wveryReserve = Number(reserve1) / 10 ** 6; // WVERY has 6 decimals
    }

    if (tokenReserve === 0) return 0;
    const price = wveryReserve / tokenReserve;
    return tokenAmount * price;
  };

  const calculateEquivalentTokens = (usdcAmount: number): number => {
    if (!reserves || !token0 || !token1) return 0;

    const [reserve0, reserve1] = reserves as [bigint, bigint, number];
    const isToken0WVERY = (token0 as string).toLowerCase() === wveryAddress.toLowerCase();

    let tokenReserve, wveryReserve;
    if (isToken0WVERY) {
      wveryReserve = Number(reserve0) / 10 ** 6; // WVERY has 6 decimals
      tokenReserve = Number(reserve1) / 10 ** 18; // Token has 18 decimals
    } else {
      tokenReserve = Number(reserve0) / 10 ** 18; // Token has 18 decimals
      wveryReserve = Number(reserve1) / 10 ** 6; // WVERY has 6 decimals
    }

    if (wveryReserve === 0) return 0;
    const price = tokenReserve / wveryReserve;
    return usdcAmount * price;
  };

  // Get swap amount out for real-time calculation
  const { data: wveryAmountOut } = useScaffoldReadContract({
    contractName: "LaunchpadV2",
    functionName: "getSwapAmountOut",
    args: [campaign.id, swapFromAmountInWei],
    query: {
      enabled: swapDirection === "token-to-wvery" && Number(swapFromAmount) > 0,
    },
  });

  const { data: tokenAmountOut } = useScaffoldReadContract({
    contractName: "LaunchpadV2",
    functionName: "getTokenAmountOut",
    args: [campaign.id, swapFromAmountInWei],
    query: {
      enabled: swapDirection === "wvery-to-token" && Number(swapFromAmount) > 0,
    },
  });

  const handleSwapFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setSwapFromAmount(value);
    }
  };

  const handleSwapToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setSwapToAmount(value);
      setSwapFromAmount(value);
    }
  };

  // Update swapToAmount when contract data changes
  useEffect(() => {
    if (swapDirection === "token-to-wvery" && wveryAmountOut) {
      const formattedAmount = (Number(wveryAmountOut) / 10 ** 6).toString();
      setSwapToAmount(formattedAmount);
    } else if (swapDirection === "wvery-to-token" && tokenAmountOut) {
      const formattedAmount = (Number(tokenAmountOut) / 10 ** 18).toString();
      setSwapToAmount(formattedAmount);
    }
  }, [wveryAmountOut, tokenAmountOut, swapDirection]);

  const handleSwapDirectionToggle = () => {
    setSwapDirection(prev => (prev === "token-to-wvery" ? "wvery-to-token" : "token-to-wvery"));
    // Swap the amounts when direction changes
    const tempFrom = swapFromAmount;
    setSwapFromAmount(swapToAmount);
    setSwapToAmount(tempFrom);
  };

  const { data: wveryBalance } = useScaffoldReadContract({
    contractName: "WrappedVery",
    functionName: "balanceOf",
    args: [connectedAddress || ""],
  });

  const tokenBalance = useReadContract({
    abi: erc20Abi,
    address: campaign.tokenAddress,
    functionName: "balanceOf",
    args: [connectedAddress || ""],
    query: {
      refetchInterval: 10000,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    },
  });

  const swap = async () => {
    if (!swapFromAmount || Number(swapFromAmount) <= 0) {
      console.error("Invalid swap amount");
      return;
    }

    if (swapDirection === "wvery-to-token") {
      try {
        await approveToken(wveryAddress, 6000000000000 as unknown as bigint);

        // Calculate minimum token output with 2% slippage tolerance
        const expectedTokenOut = tokenAmountOut || 0n;
        if (expectedTokenOut === 0n) {
          console.error("No expected token output calculated");
          return;
        }
        const minTokenOut = (expectedTokenOut * 98n) / 100n; // 2% slippage tolerance

        console.log("Swapping WVERY for token:", {
          campaignId: campaign.id,
          usdcAmount: swapFromAmountInWei.toString(),
          minTokenOut: minTokenOut.toString(),
          expectedTokenOut: expectedTokenOut.toString(),
        });

        await writeYourContractAsync({
          functionName: "swapUsdcForToken",
          args: [campaign.id, swapFromAmountInWei, minTokenOut, BigInt(Math.floor(Date.now() / 1000) + 60 * 5)],
        });
      } catch (e) {
        console.error("Error swapping WVERY for token:", e);
      }
    } else if (swapDirection === "token-to-wvery") {
      try {
        await approveToken(campaign.tokenAddress, 60000000000000000000000 as unknown as bigint);

        // Calculate minimum WVERY output with 2% slippage tolerance
        const expectedWveryOut = wveryAmountOut || 0n;
        if (expectedWveryOut === 0n) {
          console.error("No expected WVERY output calculated");
          return;
        }
        const minWveryOut = (expectedWveryOut * 98n) / 100n; // 2% slippage tolerance

        console.log("Swapping token for WVERY:", {
          campaignId: campaign.id,
          tokenAmount: swapFromAmountInWei.toString(),
          minWveryOut: minWveryOut.toString(),
          expectedWveryOut: expectedWveryOut.toString(),
        });

        await writeYourContractAsync({
          functionName: "swapTokenForUsdc",
          args: [campaign.id, swapFromAmountInWei, minWveryOut, BigInt(Math.floor(Date.now() / 1000) + 60 * 5)],
        });
      } catch (e) {
        console.error("Error swapping token for WVERY:", e);
      }
    }
  };

  const addLiquidity = async () => {
    if (!collateralAmount || !borrowAmount) {
      console.error("Both token and WVERY amounts are required");
      return;
    }

    // Warn if ratios are significantly different from pool (if pool exists)
    if (hasPoolData && collateralValue > 0) {
      const userRatio = borrowValue / collateralValue;
      const priceDeviation = Math.abs((userRatio - currentPoolPrice) / currentPoolPrice);

      if (priceDeviation > 0.05) {
        // 5% deviation threshold
        const confirmMsg = `Your ratio (1:${userRatio.toFixed(6)}) differs from the current pool ratio (1:${currentPoolPrice?.toFixed(6) || "0.000000"}) by ${(priceDeviation * 100).toFixed(1)}%. This may result in immediate impermanent loss. Continue?`;
        if (!confirm(confirmMsg)) {
          return;
        }
      }
    }

    const tokenAmountInWei = BigInt(Math.floor(Number(collateralAmount) * 10 ** 18));
    const wveryAmountInWei = BigInt(Math.floor(Number(borrowAmount) * 10 ** 6));

    // Set minimum liquidity amounts with 2% slippage tolerance
    const minTokenLiquidity = BigInt(Math.floor(Number(tokenAmountInWei) * 0.98));
    const minWveryLiquidity = BigInt(Math.floor(Number(wveryAmountInWei) * 0.98));

    // Set deadline to 5 minutes from now
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 5);

    try {
      // Approve token spending
      console.log("Approving token...");
      await approveToken(campaign.tokenAddress, 60000000000000000000000 as unknown as bigint);

      // Approve WVERY spending
      console.log("Approving WVERY...");
      await approveToken(wveryAddress, 6000000000000 as unknown as bigint);

      // Add liquidity to pool
      console.log("Adding liquidity...");
      await writeYourContractAsync({
        functionName: "addLiquidityToPool",
        args: [campaign.id, tokenAmountInWei, wveryAmountInWei, minTokenLiquidity, minWveryLiquidity, deadline],
      });

      // Clear input fields on success
      setCollateralAmount("");
      setBorrowAmount("");

      console.log("Liquidity added successfully!");
    } catch (e) {
      console.error("Error adding liquidity:", e);
    }
  };

  const collateralValue = Number.parseFloat(collateralAmount) || 0;
  const borrowValue = Number.parseFloat(borrowAmount) || 0;

  const swapFromToken =
    swapDirection === "token-to-wvery"
      ? { name: campaign.symbol, symbol: "🐄", color: "bg-green-500" }
      : { name: "WVERY", symbol: "$", color: "bg-blue-500", image: "/very.svg" };
  const swapToToken =
    swapDirection === "token-to-wvery"
      ? { name: "WVERY", symbol: "$", color: "bg-blue-500", image: "/very.svg" }
      : { name: campaign.symbol, symbol: "🐄", color: "bg-green-500" };

  const formattedWveryAmount = Number(wveryBalance ?? 0n) / 10 ** 6;
  const formattedTokenAmount = Number(tokenBalance.data ?? 0n) / 10 ** 18;

  // Updated handleMaxClick function for liquidity tab
  const handleMaxClick = (inputType?: "collateral" | "borrow") => {
    if (activeTab === "liquidity") {
      if (inputType === "collateral") {
        // Set max token amount for collateral input
        setCollateralAmount(formattedTokenAmount.toString());
      } else if (inputType === "borrow") {
        // Set max WVERY amount for borrow input
        setBorrowAmount(formattedWveryAmount.toFixed(6));
      }
    } else {
      // Trade tab logic (existing)
      if (swapDirection === "wvery-to-token") {
        setSwapFromAmount(formattedWveryAmount.toString());
      } else {
        setSwapFromAmount(formattedTokenAmount.toString());
      }
    }
  };

  const handleStakeMaxClick = () => {
    setStakeAmount(formattedTokenAmount);
  };

  const handleStakeAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setStakeAmount(Number(value));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Tabs */}
      <div className="flex items-center">
        <button
          onClick={() => setActiveTab("trade")}
          className={`px-4 py-1 rounded-3xl text-sm font-medium transition-colors ${
            activeTab === "trade" ? "bg-[#FF6B7A] text-white" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Trade
        </button>
        <button
          onClick={() => setActiveTab("liquidity")}
          className={`px-4 py-1 rounded-3xl text-sm font-medium transition-colors ${
            activeTab === "liquidity" ? "bg-[#FF6B7A] text-white" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Liquidity
        </button>
        <button
          onClick={() => setActiveTab("stake")}
          className={`px-4 py-1 rounded-3xl text-sm font-medium transition-colors ${
            activeTab === "stake" ? "bg-[#FF6B7A] text-white" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Stake
        </button>
      </div>

      {activeTab === "liquidity" ? (
        <>
          {/* Supply token Section */}
          <div className="bg-[#1A1A1A] rounded-3xl px-6 py-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-300 text-lg">Supply {campaign.name}</h3>
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">₿</span>
              </div>
            </div>

            <div className="mb-3">
              <input
                type="text"
                value={collateralAmount}
                onChange={handleCollateralChange}
                placeholder="0.00"
                className="text-4xl font-light text-gray-300 bg-transparent border-none outline-none w-full placeholder-gray-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-gray-500 text-sm">${Number(formattedTokenAmount).toFixed(2)}</div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">
                  {Number(formattedTokenAmount).toFixed(2)} {campaign.symbol}
                </span>
                <Button
                  onClick={() => handleMaxClick("collateral")}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-1 h-8 text-sm rounded-full"
                >
                  MAX
                </Button>
              </div>
            </div>
          </div>

          {/* supply WVERY Section */}
          <div className="bg-[#1A1A1A] rounded-3xl px-6 py-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-300 text-lg">Supply WVERY</h3>
              <Image src="/very.svg" alt="WVERY" width={16} height={16} className="w-5 h-5" />
            </div>

            <div className="mb-3">
              <input
                type="text"
                value={borrowAmount}
                onChange={handleBorrowChange}
                placeholder="0.00"
                className="text-4xl font-light text-gray-400 bg-transparent border-none outline-none w-full placeholder-gray-500"
                onFocus={e => e.target.select()}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-gray-500 text-sm">
                ${borrowValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">{formattedWveryAmount.toFixed(2)} WVERY</span>
                <Button
                  onClick={() => handleMaxClick("borrow")}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-1 h-8 text-sm rounded-full"
                >
                  MAX
                </Button>
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="bg-[#151b1e] rounded-3xl px-6 py-4 shadow-lg space-y-4">
            {hasPoolData ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Current Pool Price</span>
                  <span className="text-white">${currentPoolPrice?.toFixed(6) || "0.000000"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Pool Ratio</span>
                  <span className="text-white">
                    1 {campaign.symbol} = {currentPoolPrice?.toFixed(6) || "0.000000"} WVERY
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Your Ratio</span>
                  <span
                    className={`${
                      collateralAmount &&
                      borrowAmount &&
                      Math.abs(borrowValue / collateralValue - currentPoolPrice) / currentPoolPrice > 0.05
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}
                  >
                    {collateralAmount && borrowValue && collateralValue > 0
                      ? `1:${(borrowValue / collateralValue).toFixed(6)}`
                      : "---"}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Pool Status</span>
                  <span className="text-yellow-400">No liquidity pool found</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Note</span>
                  <span className="text-gray-400 text-sm">You can set any ratio for initial liquidity</span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-300">Slippage Tolerance</span>
              <span className="text-white">2%</span>
            </div>
          </div>

          <Button
            onClick={addLiquidity}
            disabled={!isConnected || !collateralAmount || !borrowAmount}
            className="w-full bg-[#FF6B7A] hover:bg-[#FF8B7A] rounded-3xl text-white py-7 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {!isConnected ? "Connect Wallet" : "Add Liquidity"}
          </Button>
        </>
      ) : activeTab === "trade" ? (
        <>
          {/* Swap From Section */}
          <div className="bg-[#1A1A1A] rounded-3xl px-6 py-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 text-lg">From {swapFromToken.name}</h3>
              <div className={`w-6 h-6 ${swapFromToken.color} rounded-full flex items-center justify-center`}>
                <span className="text-white text-sm">{swapFromToken.symbol}</span>
              </div>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={swapFromAmount}
                onChange={handleSwapFromChange}
                placeholder="0.00"
                className="text-4xl font-light text-gray-400 bg-transparent border-none outline-none w-full placeholder-gray-500"
              />
            </div>
            {swapDirection === "wvery-to-token" && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">${Number(formattedWveryAmount)?.toFixed(2)}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm">{Number(formattedWveryAmount).toFixed(2)} WVERY</span>
                  <Button
                    onClick={() => handleMaxClick()}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-1 h-8 text-sm rounded-full"
                  >
                    MAX
                  </Button>
                </div>
              </div>
            )}

            {swapDirection === "token-to-wvery" && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">${Number(formattedTokenAmount)?.toFixed(2)}</span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm">
                    {Number(formattedTokenAmount).toFixed(2)} {campaign.symbol}
                  </span>
                  <Button
                    onClick={() => handleMaxClick()}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-1 h-8 text-sm rounded-full"
                  >
                    MAX
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleSwapDirectionToggle}
              className="w-9 h-9 bg-[#1A1A1A] hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors border-2 border-gray-700"
            >
              <ArrowUpDown className="w-5 h-5 text-gray-300" />
            </button>
          </div>

          {/* Swap To Section */}
          <div className="bg-[#1A1A1A] rounded-3xl px-6 py-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 text-lg">To {swapToToken.name}</h3>
              <div className={`w-6 h-6 ${swapToToken.color} rounded-full flex items-center justify-center`}>
                <span className="text-white text-sm">{swapToToken.symbol}</span>
              </div>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={swapToAmount}
                onChange={handleSwapToChange}
                placeholder="0.00"
                className="text-4xl font-light text-gray-400 bg-transparent border-none outline-none w-full placeholder-gray-500"
              />
            </div>

            <div className="text-gray-500 text-sm">
              $
              {(Number.parseFloat(swapToAmount) || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          <div className="bg-[#151b1e] rounded-3xl px-6 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Exchange Rate</span>
              <span className="text-white">
                1 {campaign.symbol} : {currentPoolPrice?.toFixed(6) || "0.000000"} WVERY
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-300">Swap Direction</span>
              <span className="text-white capitalize">{swapDirection.replace("-", " → ")}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-300">Expected Output</span>
              <span className="text-white">~{swapToAmount}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-300">Slippage Tolerance</span>
              <span className="text-white">2%</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-300">Minimum Receivable</span>
              <span className="text-yellow-400">
                ~
                {swapDirection === "wvery-to-token"
                  ? (Number(swapToAmount) * 0.98).toFixed(6)
                  : (Number(swapToAmount) * 0.98).toFixed(2)}
              </span>
            </div>
          </div>

          <Button
            onClick={swap}
            disabled={
              !isConnected ||
              !swapFromAmount ||
              Number(swapFromAmount) <= 0 ||
              (swapDirection === "wvery-to-token" && (!tokenAmountOut || tokenAmountOut === 0n)) ||
              (swapDirection === "token-to-wvery" && (!wveryAmountOut || wveryAmountOut === 0n))
            }
            className="w-full bg-[#FF6B7A] hover:bg-[#FF8B7A] rounded-3xl text-white py-7 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {!isConnected
              ? "Connect Wallet"
              : !swapFromAmount || Number(swapFromAmount) <= 0
                ? "Enter Amount"
                : swapDirection === "wvery-to-token" && (!tokenAmountOut || tokenAmountOut === 0n)
                  ? "Calculating..."
                  : swapDirection === "token-to-wvery" && (!wveryAmountOut || wveryAmountOut === 0n)
                    ? "Calculating..."
                    : "Swap Tokens"}
          </Button>
        </>
      ) : stakingPool?.enabled ? (
        <div className="w-full max-w-md space-y-4">
          {/* Main Deposit Card */}
          <div className="bg-[#11181C] rounded-3xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-300 text-lg font-medium">Stake {campaign.symbol}</h2>
              <Image src="/very.svg" alt="WVERY" width={16} height={16} className="w-5 h-5" />
            </div>

            <input
              type="text"
              value={stakeAmount}
              onChange={handleStakeAmountChange}
              placeholder="0.00"
              className="text-6xl font-light text-gray-300 mb-6 bg-transparent border-none outline-none w-full placeholder-gray-500"
            />

            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-lg">${Number(formattedWveryAmount)?.toFixed(2)}</span>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">
                  {Number(stakeAmount).toFixed(2)} {campaign.symbol}
                </span>
                <Button
                  onClick={handleStakeMaxClick}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-1 h-8 text-sm rounded-full"
                >
                  MAX
                </Button>
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-[#11181C] rounded-3xl p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image src="/very.svg" alt="WVERY" width={16} height={16} className="w-5 h-5" />
                <span className="text-gray-300">Stake {campaign.symbol}</span>
              </div>
              <span className="text-gray-300">{stakeAmount?.toFixed(2) || "0.00"}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Platform OG points</span>
              <div className="flex items-center gap-2">
                <div className="flex">
                  <span className="text-blue-400">✨</span>
                  <span className="text-blue-400">✨</span>
                </div>
                <span className="text-blue-400 font-medium">{campaign.promotionalOgPoints}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">APY</span>
              <span className="text-gray-300">{formattedTokenAmount.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total staked</span>
              <span className="text-gray-300">
                ${formatAmount(stakingPool.totalStaked)} {campaign.symbol}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Reward pool</span>
              <span className="text-gray-300">{formatAmount(stakingPool.rewardPool)}</span>
            </div>
          </div>

          <Button
            // onClick={() => console.log("Add Liquidity")}
            disabled={!isConnected || !collateralAmount || !borrowAmount}
            className="w-full bg-[#FF6B7A] hover:bg-[#FF8B7A] rounded-3xl text-white py-7 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {!isConnected ? "Connect Wallet" : "Add Liquidity"}
          </Button>
        </div>
      ) : campaign?.creator === connectedAddress ? (
        <>
          <>
            <Card className="bg-[#19242a] border-[#3e545f] h-96 w-full px-10">
              <div className="flex items-center justify-center w-full h-full">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full flex justify-center items-center bg-[#546054b0] text-[#8daa98]">
                    <X size={27} />
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <div className="font-medium text-lg text-[#8daa98]">Staking Not enabled for this Campaign</div>
                    <p className="text-sm text-[#6a7c6ab0] text-center">
                      Reach out to the team to create a staking pool for your campaign and enable staking
                    </p>
                    <Button
                      size="sm"
                      className="text-[#8daa98] hover:text-white flex items-center bg-[#25333b] h-10 w-40 rounded-lg font-semibold"
                    >
                      Reach out
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </>
        </>
      ) : (
        <>
          <Card className="bg-[#19242a] border-[#3e545f] h-96 w-full px-10">
            <div className="flex items-center justify-center w-full h-full">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full flex justify-center items-center bg-[#546054b0] text-[#8daa98]">
                  <X size={27} />
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="font-medium text-lg text-[#8daa98]">Staking Not enabled for this Campaign</div>
                  <p className="text-sm text-[#6a7c6ab0]">Let the owner know you need this feature</p>
                  <div className="flex items-center gap-4">
                    <div className="bg-[#546054b0] text-[#8daa98] w-14 h-14 rounded-full flex justify-center items-center transition-transform hover:scale-y-110 hover:scale-x-110 active:scale-x-150">
                      <ThumbsUp />
                    </div>
                    <div className="bg-[#546054b0] text-[#8daa98] w-14 h-14 rounded-full flex justify-center items-center transition-transform hover:scale-y-110 hover:scale-x-110 active:scale-x-150">
                      <ThumbsDown />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
