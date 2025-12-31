"use client";

import { useState } from "react";
import Image from "next/image";
import { BorrowInterface } from "./borrow-interface";
import { WveryFaucetModal } from "./wvery-faucet-modal";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { toast } from "sonner";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import { Button } from "~~/components/ui/button";
import { Skeleton } from "~~/components/ui/skeleton";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { useWepin } from "~~/hooks/useWepin";
import { formatAmount } from "~~/lib/utils";
import { ICampaign } from "~~/types/interface";

export function DepositSidebar({ campaign }: { campaign: ICampaign | undefined }) {
  const { address: wagmiAddress } = useAccount();
  const { isConnected: wepinConnected, walletAddress: wepinAddress } = useWepin();
  const chainId = useChainId();

  // Use Wepin address if connected via Wepin, otherwise use wagmi address
  const connectedAddress = wepinConnected ? (wepinAddress as `0x${string}`) : wagmiAddress;
  const isWalletConnected = wepinConnected || !!wagmiAddress;
  const [amount, setAmount] = useState<number>(0);
  const [showFaucetModal, setShowFaucetModal] = useState(false);
  const { writeContractAsync } = useWriteContract();
  const contracts = deployedContracts[chainId as keyof typeof deployedContracts];

  // Get Launchpad contract info (buyTokens is on Launchpad, not LaunchpadV2)
  const contractAddress = contracts && "Launchpad" in contracts ? contracts.Launchpad.address : "";
  const launchpadAbi = contracts && "Launchpad" in contracts ? contracts.Launchpad.abi : [];
  const wveryAddress = contracts && "WrappedVery" in contracts ? contracts.WrappedVery.address : "";
  const wveryAbi = contracts && "WrappedVery" in contracts ? contracts.WrappedVery.abi : [];

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAmount(Number(value));
    }
  };

  // Convert amount to BigInt with proper decimal handling for WVERY (6 decimals)
  const amountInWei = amount > 0 ? BigInt(Math.floor(amount * 10 ** 6)) : 0n;
  const amountToApprove = 6000000000000n;

  const { data: purchaseReturn } = useScaffoldReadContract({
    contractName: "LaunchpadV2",
    functionName: "previewPurchase",
    args: [campaign?.id || 0, amountInWei],
  });

  const buyTokens = async () => {
    const toastId = toast.loading("Buying tokens...", {
      position: "top-right",
    });

    if (amount === 0) {
      toast.error("Amount must be greater than 0", {
        id: toastId,
        position: "top-right",
      });
      return;
    }

    // Check if we have sufficient WVERY balance
    if (amountInWei > (wveryBalance ?? 0n)) {
      toast.error("Insufficient WVERY balance", {
        id: toastId,
        position: "top-right",
      });
      return;
    }

    try {
      // Check if we need to approve more WVERY
      if (amountInWei > (wveryAllowance ?? 0n)) {
        console.log("Approving WVERY...", {
          amountInWei: amountInWei.toString(),
          amountToApprove: amountToApprove.toString(),
          currentAllowance: wveryAllowance?.toString() || "0",
          contractAddress,
        });
        await approveWvery();
        toast.success("WVERY approved successfully", {
          id: toastId,
          position: "top-right",
        });
      }

      console.log("Buying tokens...", {
        campaignId: campaign?.id,
        amountInWei: amountInWei.toString(),
        contractAddress,
        chainId,
      });
      await depositWvery();
      toast.success("Tokens purchased successfully!", {
        id: toastId,
        position: "top-right",
      });
    } catch (error: any) {
      console.error("Error buying tokens:", error);
      toast.error(error.message || "Error buying tokens", {
        id: toastId,
        position: "top-right",
      });
    }
  };

  const depositWvery = async () => {
    try {
      // Use buyTokens(uint32 campaignId, uint128 amount)
      try {
        await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: launchpadAbi as any,
          functionName: "buyTokens",
          args: [campaign?.id || 0, amountInWei],
        } as any);
      } catch (gasError) {
        console.log("Gas estimation failed, using fixed gas limit:", gasError);
        await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: launchpadAbi as any,
          functionName: "buyTokens",
          args: [campaign?.id || 0, amountInWei],
          gas: 500000n,
        } as any);
      }
    } catch (e) {
      console.error("Error buying tokens:", e);
      throw e;
    }
  };

  const approveWvery = async () => {
    try {
      try {
        await writeContractAsync({
          address: wveryAddress as `0x${string}`,
          abi: wveryAbi,
          functionName: "approve",
          args: [contractAddress, amountToApprove],
        });
      } catch (gasError) {
        console.log("Gas estimation failed for approval, using fixed gas limit:", gasError);
        await writeContractAsync({
          address: wveryAddress as `0x${string}`,
          abi: wveryAbi,
          functionName: "approve",
          args: [contractAddress, amountToApprove],
          gas: 100000n,
        });
      }
    } catch (e) {
      console.error("Error approving WVERY:", e);
      throw e;
    }
  };

  const { data: wveryBalance } = useScaffoldReadContract({
    contractName: "WrappedVery",
    functionName: "balanceOf",
    args: [connectedAddress || ""],
  });

  const { data: wveryAllowance } = useScaffoldReadContract({
    contractName: "WrappedVery",
    functionName: "allowance",
    args: [connectedAddress || "", contractAddress],
  });

  const formattedWveryAmount = Number(wveryBalance ?? 0n) / 10 ** 6;
  const formattedTokenAmount = Number(purchaseReturn ?? 0n) / 10 ** 18;

  const handleMaxClick = () => {
    setAmount(formattedWveryAmount);
  };

  const stakingPool = undefined;

  if (!campaign) {
    return <Skeleton className="h-[700px] w-[400px] bg-[#0F0F0F] rounded-2xl" />;
  }

  return campaign.isFundingComplete ? (
    <BorrowInterface campaign={campaign} stakingPool={stakingPool} />
  ) : (
    <div className="w-full max-w-md space-y-4">
      {/* Main Deposit Card */}
      <div className="bg-[#1A1A1A] rounded-3xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-gray-300 text-lg font-medium">Deposit WVERY</h2>
          <Image src="/very.svg" alt="WVERY" width={16} height={16} className="w-5 h-5" />
        </div>

        <input
          type="text"
          value={amount}
          onChange={handleAmountChange}
          placeholder="0.00"
          className="text-6xl font-light text-gray-300 mb-6 bg-transparent border-none outline-none w-full placeholder-gray-500"
        />

        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-lg">${Number(formattedWveryAmount)?.toFixed(2)}</span>
          <div className="flex items-center gap-3">
            <span className="text-gray-400">{Number(amount).toFixed(2)} WVERY</span>
            <Button
              onClick={handleMaxClick}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-1 h-8 text-sm rounded-full"
            >
              MAX
            </Button>
          </div>
        </div>

        {/* Show Get WVERY link - always visible when wallet connected */}
        {isWalletConnected && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            {formattedWveryAmount === 0 ? (
              <Button
                onClick={() => setShowFaucetModal(true)}
                variant="outline"
                className="w-full border-[#FF6B7A] text-[#FF6B7A] hover:bg-[#FF6B7A]/10 rounded-xl py-3"
              >
                Get WVERY Tokens
              </Button>
            ) : (
              <button
                onClick={() => setShowFaucetModal(true)}
                className="text-sm text-[#FF6B7A] hover:text-[#FF8B7A] underline w-full text-center"
              >
                Need more WVERY?
              </button>
            )}
          </div>
        )}
      </div>

      {/* Details Card */}
      <div className="bg-[#11181C] rounded-3xl p-6 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/very.svg" alt="WVERY" width={16} height={16} className="w-5 h-5" />
            <span className="text-gray-300">Deposit (WVERY)</span>
          </div>
          <span className="text-gray-300">{amount.toFixed(2)}</span>
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
          <span className="text-gray-400">Minimum expected tokens</span>
          <span className="text-gray-300">{formattedTokenAmount.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400">Available for sale</span>
          <span className="text-gray-300">${formatAmount(campaign.tokensForSale)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400">WVERY Allowance</span>
          <span className="text-gray-300">
            {wveryAllowance ? (Number(wveryAllowance) / 10 ** 6).toFixed(2) : "0.00"} WVERY
          </span>
        </div>
      </div>

      <ConnectButton.Custom>
        {({ account, chain, openConnectModal, mounted }) => {
          // Check if connected via RainbowKit OR Wepin
          const isRainbowKitConnected = mounted && account && chain;
          const isConnected = isRainbowKitConnected || wepinConnected;

          return isConnected ? (
            <Button
              onClick={buyTokens}
              className="text-center bg-[#FF6B7A] hover:bg-[#FF8B7A] rounded-3xl py-7 w-full transition-colors"
            >
              <span className="text-white text-lg">{amount > 0 ? "Purchase" : "Enter an amount"}</span>
            </Button>
          ) : (
            <Button
              onClick={openConnectModal}
              className="text-center bg-[#FF6B7A] hover:bg-[#FF8B7A] rounded-3xl py-7 w-full transition-colors"
            >
              <span className="text-white text-lg">Connect Wallet</span>
            </Button>
          );
        }}
      </ConnectButton.Custom>

      {/* WVERY Faucet Modal */}
      <WveryFaucetModal isOpen={showFaucetModal} onClose={() => setShowFaucetModal(false)} />
    </div>
  );
}
