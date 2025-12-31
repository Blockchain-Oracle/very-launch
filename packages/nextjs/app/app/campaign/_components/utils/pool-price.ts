import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAddress, parseAbi } from "viem";
import { useChainId, usePublicClient, useReadContracts, useWatchContractEvent } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";

// Updated ABI to match your BumdexPair contract
export const bumdexPairAbi = [
  {
    inputs: [],
    name: "getReserves",
    outputs: [
      { name: "_reserve0", type: "uint112" },
      { name: "_reserve1", type: "uint112" },
      { name: "_blockTimestampLast", type: "uint32" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token0",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token1",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "sender", type: "address" },
      { indexed: false, name: "amount0In", type: "uint256" },
      { indexed: false, name: "amount1In", type: "uint256" },
      { indexed: false, name: "amount0Out", type: "uint256" },
      { indexed: false, name: "amount1Out", type: "uint256" },
      { indexed: true, name: "to", type: "address" },
    ],
    name: "Swap",
    type: "event",
  },
] as const;

// ERC20 ABI for getting token decimals
const erc20Abi = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface SwapEvent {
  transactionHash: string;
  blockNumber: bigint;
  timestamp: number;
  sender: string;
  to: string;
  amount0In: bigint;
  amount1In: bigint;
  amount0Out: bigint;
  amount1Out: bigint;
  amountInUSD: number;
  amountOutUSD: number;
  pricePerToken: number;
  type: "buy" | "sell";
}

interface PoolMetrics {
  volume24h: number;
  tvl: number;
  liquidity: number;
  totalSupply: bigint;
}

export function usePoolPrice(uniswapPairAddress: string | undefined) {
  const [swapEvents, setSwapEvents] = useState<SwapEvent[]>([]);
  const [poolMetrics, setPoolMetrics] = useState<PoolMetrics>({
    volume24h: 0,
    tvl: 0,
    liquidity: 0,
    totalSupply: 0n,
  });
  // Removed iscalculating state as it was causing infinite loops when set inside useMemo
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chainId = useChainId();
  const contracts = deployedContracts[chainId as keyof typeof deployedContracts];
  const wveryAddress = (contracts && "WrappedVery" in contracts ? contracts.WrappedVery.address : "").toLowerCase();
  const publicClient = usePublicClient();
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  // Validate pair address
  const isValidPairAddress = useMemo(() => {
    if (!uniswapPairAddress) return false;
    try {
      getAddress(uniswapPairAddress);
      return uniswapPairAddress !== "0x0000000000000000000000000000000000000000";
    } catch {
      return false;
    }
  }, [uniswapPairAddress]);

  // Get all contract data in batch
  const { data: contractData, refetch: refetchContractData } = useReadContracts({
    contracts: [
      {
        abi: bumdexPairAbi,
        address: uniswapPairAddress as `0x${string}`,
        functionName: "getReserves",
      },
      {
        abi: bumdexPairAbi,
        address: uniswapPairAddress as `0x${string}`,
        functionName: "token0",
      },
      {
        abi: bumdexPairAbi,
        address: uniswapPairAddress as `0x${string}`,
        functionName: "token1",
      },
      {
        abi: bumdexPairAbi,
        address: uniswapPairAddress as `0x${string}`,
        functionName: "totalSupply",
      },
    ],
    query: {
      enabled: isValidPairAddress,
      staleTime: 30000, // 30 seconds
    },
  });

  // Extract data from batch result
  const reserves = contractData?.[0]?.result;
  const token0 = contractData?.[1]?.result;
  const token1 = contractData?.[2]?.result;
  const totalSupply = contractData?.[3]?.result;

  // Debug logs commented out to reduce console spam
  // console.log("Pool Address:", uniswapPairAddress);
  // console.log("token0", token0);
  // console.log("token1", token1);
  // console.log("isValidPairAddress", isValidPairAddress);

  // Get token decimals
  const { data: tokenDecimals } = useReadContracts({
    contracts: [
      {
        abi: erc20Abi,
        address: token0 as `0x${string}`,
        functionName: "decimals",
      },
      {
        abi: erc20Abi,
        address: token1 as `0x${string}`,
        functionName: "decimals",
      },
    ],
    query: {
      enabled: !!(token0 && token1),
    },
  });

  const token0Decimals = tokenDecimals?.[0]?.result || 18;
  const token1Decimals = tokenDecimals?.[1]?.result || 18;

  // Calculate current pool price - memoized to prevent recalculation
  const getCurrentPoolPrice = useCallback((): number => {
    if (!reserves || !token0 || !token1) {
      return 0;
    }

    try {
      const [reserve0, reserve1] = reserves as [bigint, bigint, number];
      const isToken0WVERY = (token0 as string).toLowerCase() === wveryAddress;

      let tokenReserve, usdcReserve;
      if (isToken0WVERY) {
        usdcReserve = Number(reserve0) / 10 ** 6; // USDC has 6 decimals
        tokenReserve = Number(reserve1) / 10 ** token1Decimals;
      } else {
        tokenReserve = Number(reserve0) / 10 ** token0Decimals;
        usdcReserve = Number(reserve1) / 10 ** 6;
      }

      const price = tokenReserve > 0 ? usdcReserve / tokenReserve : 0;
      return price;
    } catch (error) {
      console.error("Error calculating price:", error);
      return 0;
    }
  }, [reserves, token0, token1, wveryAddress, token0Decimals, token1Decimals]);

  // Calculate TVL and Liquidity - memoized to prevent recalculation
  const calculatePoolMetrics = useMemo(() => {
    if (!reserves || !token0 || !token1) {
      return { tvl: 0, liquidity: 0 };
    }

    try {
      const [reserve0, reserve1] = reserves as [bigint, bigint, number];
      const isToken0WVERY = (token0 as string).toLowerCase() === wveryAddress;

      let usdcReserve, tokenReserve;
      if (isToken0WVERY) {
        usdcReserve = Number(reserve0) / 10 ** 6;
        tokenReserve = Number(reserve1) / 10 ** token1Decimals;
      } else {
        tokenReserve = Number(reserve0) / 10 ** token0Decimals;
        usdcReserve = Number(reserve1) / 10 ** 6;
      }

      // Current token price in USD
      const currentPrice = tokenReserve > 0 ? usdcReserve / tokenReserve : 0;

      // TVL = total value locked in USD
      // TVL = USDC reserve + (token reserve * token price in USD)
      const tvl = usdcReserve + tokenReserve * currentPrice;

      // For AMM pools, liquidity is often calculated as the geometric mean of reserves
      // Liquidity = sqrt(reserve0_usd * reserve1_usd)
      const tokenReserveInUSD = tokenReserve * currentPrice;
      const liquidity = Math.sqrt(usdcReserve * tokenReserveInUSD);

      return { tvl, liquidity };
    } catch (error) {
      console.error("Error calculating pool metrics:", error);
      return { tvl: 0, liquidity: 0 };
    }
  }, [reserves, token0, token1, wveryAddress, token0Decimals, token1Decimals]);

  // Fetch historical swap events - memoized to prevent recreation
  const fetchSwapEvents = useCallback(
    async (fromBlock?: bigint) => {
      if (!publicClient || !isValidPairAddress || !token0 || !token1) {
        return;
      }

      // Prevent multiple simultaneous fetches
      if (isFetchingRef.current) {
        return;
      }

      // Debounce: don't fetch more than once every 5 seconds
      const now = Date.now();
      if (now - lastFetchTimeRef.current < 5000) {
        return;
      }

      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      setIsLoading(true);
      setError(null);

      try {
        const currentBlock = await publicClient.getBlockNumber();
        // On local networks, currentBlock might be < 1000, so ensure we don't go negative
        const fromBlockNumber = fromBlock || (currentBlock > 1000n ? currentBlock - 1000n : 0n);

        // Use the exact event signature from your contract
        const swapEventAbi = parseAbi([
          "event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)",
        ]);

        const logs = await publicClient.getLogs({
          address: uniswapPairAddress as `0x${string}`,
          event: swapEventAbi[0],
          fromBlock: fromBlockNumber,
          toBlock: currentBlock,
        });

        console.log("Found", logs.length, "swap events");

        const swapEventsWithDetails: SwapEvent[] = [];
        const currentPrice = getCurrentPoolPrice();
        const isToken0WVERY = (token0 as string).toLowerCase() === wveryAddress;

        for (const log of logs) {
          try {
            const { args, blockNumber, transactionHash } = log;

            if (!args || !blockNumber || !transactionHash) continue;

            // Get block timestamp
            const block = await publicClient.getBlock({ blockNumber });

            const { sender, amount0In, amount1In, amount0Out, amount1Out, to } = args;

            // Skip if any required values are missing
            if (
              !sender ||
              !to ||
              amount0In === undefined ||
              amount1In === undefined ||
              amount0Out === undefined ||
              amount1Out === undefined
            )
              continue;

            // Determine if it's a buy or sell
            let type: "buy" | "sell";
            let amountInUSD = 0;
            let amountOutUSD = 0;
            let pricePerToken = 0;

            if (isToken0WVERY) {
              if (amount0In > 0n) {
                // Buying token with USDC
                type = "buy";
                amountInUSD = Number(amount0In) / 10 ** 6;
                amountOutUSD = (Number(amount1Out) / 10 ** token1Decimals) * currentPrice;
                pricePerToken = amountInUSD / (Number(amount1Out) / 10 ** token1Decimals);
              } else {
                // Selling token for USDC
                type = "sell";
                amountInUSD = (Number(amount1In) / 10 ** token1Decimals) * currentPrice;
                amountOutUSD = Number(amount0Out) / 10 ** 6;
                pricePerToken = amountOutUSD / (Number(amount1In) / 10 ** token1Decimals);
              }
            } else {
              if (amount1In > 0n) {
                // Buying token with USDC
                type = "buy";
                amountInUSD = Number(amount1In) / 10 ** 6;
                amountOutUSD = (Number(amount0Out) / 10 ** token0Decimals) * currentPrice;
                pricePerToken = amountInUSD / (Number(amount0Out) / 10 ** token0Decimals);
              } else {
                // Selling token for USDC
                type = "sell";
                amountInUSD = (Number(amount0In) / 10 ** token0Decimals) * currentPrice;
                amountOutUSD = Number(amount1Out) / 10 ** 6;
                pricePerToken = amountOutUSD / (Number(amount0In) / 10 ** token0Decimals);
              }
            }

            swapEventsWithDetails.push({
              transactionHash,
              blockNumber,
              timestamp: Number(block.timestamp),
              sender,
              to,
              amount0In,
              amount1In,
              amount0Out,
              amount1Out,
              amountInUSD,
              amountOutUSD,
              pricePerToken,
              type,
            });
          } catch (eventError) {
            console.error("Error processing swap event:", eventError);
          }
        }

        // Sort by block number (newest first)
        swapEventsWithDetails.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));
        setSwapEvents(swapEventsWithDetails);

        // Calculate 24h volume
        const now = Date.now() / 1000;
        const volume24h = swapEventsWithDetails
          .filter(event => now - event.timestamp < 86400) // Last 24 hours
          .reduce((sum, event) => sum + Math.max(event.amountInUSD, event.amountOutUSD), 0);

        console.log("Calculated 24h volume:", volume24h);

        setPoolMetrics(prev => ({
          ...prev,
          volume24h,
          tvl: calculatePoolMetrics.tvl,
          liquidity: calculatePoolMetrics.liquidity,
          totalSupply: (totalSupply as bigint) ?? 0n,
        }));
      } catch (error) {
        console.error("Error fetching swap events:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    },
    [
      wveryAddress,
      publicClient,
      isValidPairAddress,
      token0,
      token1,
      uniswapPairAddress,
      getCurrentPoolPrice,
      token0Decimals,
      token1Decimals,
      calculatePoolMetrics,
      totalSupply,
    ],
  );

  // Listen to new swap events - optimized to prevent excessive calls
  useWatchContractEvent({
    address: uniswapPairAddress as `0x${string}`,
    abi: bumdexPairAbi,
    eventName: "Swap",
    enabled: isValidPairAddress,
    onLogs: useCallback(
      (logs: any) => {
        // Only fetch new events if we have logs and they're recent
        if (logs && logs.length > 0) {
          const latestLog = logs[logs.length - 1];
          if (latestLog && latestLog.blockNumber) {
            // Only fetch from the latest block to avoid refetching everything
            fetchSwapEvents(latestLog.blockNumber);
          }
        }
      },
      [fetchSwapEvents],
    ),
  });

  // Fetch initial data - optimized dependencies
  useEffect(() => {
    if (isValidPairAddress && token0 && token1) {
      fetchSwapEvents();
    }
  }, [isValidPairAddress, token0, token1, fetchSwapEvents]);

  const currentPoolPrice = getCurrentPoolPrice();
  const hasPoolData = reserves && token0 && token1 && currentPoolPrice > 0; // Allow 0 price

  return {
    // Existing data
    currentPoolPrice,
    hasPoolData,
    reserves,
    token0,
    token1,
    wveryAddress,

    // New data
    swapEvents,
    poolMetrics,
    totalSupply,
    isLoading,
    error,
    iscalculating: false, // Always false now to prevent infinite loops

    // Functions
    refreshData: useCallback(() => {
      refetchContractData();
      fetchSwapEvents();
    }, [refetchContractData, fetchSwapEvents]),
  };
}
