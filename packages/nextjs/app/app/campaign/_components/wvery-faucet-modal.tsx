"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import { Button } from "~~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~~/components/ui/dialog";
import deployedContracts from "~~/contracts/deployedContracts";

interface WveryFaucetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WveryFaucetModal({ isOpen, onClose }: WveryFaucetModalProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const [isLoading, setIsLoading] = useState(false);

  const contracts = deployedContracts[chainId as keyof typeof deployedContracts];
  const wveryAddress = contracts && "WrappedVery" in contracts ? contracts.WrappedVery.address : "";
  const wveryAbi = contracts && "WrappedVery" in contracts ? contracts.WrappedVery.abi : [];

  const isLocalChain = chainId === 31337;

  const handleClaimFaucet = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Claiming WVERY from faucet...", {
      position: "top-right",
    });

    try {
      // For local development, try to call the mint function
      // Note: This only works if the connected wallet is the contract owner
      // Mint 50,000 WVERY (6 decimals = 50000 * 10^6)
      const mintAmount = 50000n * 10n ** 6n; // 50,000,000,000
      await writeContractAsync({
        address: wveryAddress as `0x${string}`,
        abi: wveryAbi,
        functionName: "mint",
        args: [address, mintAmount],
      });

      toast.success("Successfully claimed WVERY!", {
        id: toastId,
        position: "top-right",
      });
      onClose();
    } catch (error: any) {
      console.error("Faucet claim error:", error);
      toast.error(
        error.message?.includes("you are not owner")
          ? "Only the contract owner can mint WVERY. Please contact the team for tokens."
          : error.message || "Failed to claim WVERY",
        {
          id: toastId,
          position: "top-right",
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1A1A1A] border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Image src="/very.svg" alt="WVERY" width={32} height={32} />
            Get WVERY Tokens
          </DialogTitle>
          <DialogDescription className="text-gray-400 pt-2">
            You need WVERY tokens to participate in campaigns.
            {isLocalChain ? " Claim tokens from the faucet below." : " Get tokens to start investing."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="bg-[#0F0F0F] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Token</span>
              <span className="text-white font-medium">Wrapped VERY (WVERY)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Decimals</span>
              <span className="text-white">6</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Network</span>
              <span className="text-white">{isLocalChain ? "Local Testnet" : "Very Network"}</span>
            </div>
          </div>

          {isLocalChain ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                Click below to claim free WVERY tokens for testing. This only works if you&apos;re the contract owner.
              </p>
              <Button
                onClick={handleClaimFaucet}
                disabled={isLoading}
                className="w-full bg-[#FF6B7A] hover:bg-[#FF8B7A] text-white py-6 rounded-xl text-lg"
              >
                {isLoading ? "Claiming..." : "Claim WVERY from Faucet"}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                To get WVERY tokens on Very Network:
              </p>
              <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
                <li>Bridge VERY tokens from another chain</li>
                <li>Purchase WVERY from a supported exchange</li>
                <li>Contact the VeryLaunch team for testnet tokens</li>
              </ul>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 py-6 rounded-xl text-lg"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
