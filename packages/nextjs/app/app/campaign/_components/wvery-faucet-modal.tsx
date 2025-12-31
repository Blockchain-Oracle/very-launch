"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import { Button } from "~~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~~/components/ui/dialog";
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

  const networkName = chainId === 31337 ? "Local Testnet" : "Very Network";

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
      // Call the faucet function - anyone can mint 50,000 WVERY
      // Has 1 hour cooldown to prevent spam
      await writeContractAsync({
        address: wveryAddress as `0x${string}`,
        abi: wveryAbi,
        functionName: "faucet",
        args: [],
      });

      toast.success("Successfully claimed WVERY!", {
        id: toastId,
        position: "top-right",
      });
      onClose();
    } catch (error: any) {
      console.error("Faucet claim error:", error);
      const errorMessage = error.message?.includes("cooldown")
        ? "Please wait 1 hour between faucet claims."
        : error.message || "Failed to claim WVERY";
      toast.error(errorMessage, {
        id: toastId,
        position: "top-right",
      });
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
            You need WVERY tokens to participate in campaigns. Claim tokens from the faucet below.
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
              <span className="text-white">{networkName}</span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-400">
              Click below to claim 50,000 free WVERY tokens. You can claim once per hour.
            </p>
            <Button
              onClick={handleClaimFaucet}
              disabled={isLoading}
              className="w-full bg-[#FF6B7A] hover:bg-[#FF8B7A] text-white py-6 rounded-xl text-lg"
            >
              {isLoading ? "Claiming..." : "Claim 50,000 WVERY"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
