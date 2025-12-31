"use client";

import { useState } from "react";
import { WepinProviderModal } from "./WepinProviderModal";
import { Button } from "~~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~~/components/ui/dialog";

interface WalletSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWeb3WalletClick: () => void;
}

export function WalletSelectionModal({ isOpen, onClose, onWeb3WalletClick }: WalletSelectionModalProps) {
  const [showWepinModal, setShowWepinModal] = useState(false);

  const handleWeb3Connect = () => {
    onWeb3WalletClick(); // Opens RainbowKit modal
    onClose(); // Close this modal
  };

  const handleWepinClick = () => {
    setShowWepinModal(true);
    onClose(); // Close this modal
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] bg-[#1A1A1A] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white text-center">Connect Wallet</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Web3 Wallets Option */}
            <Button
              onClick={handleWeb3Connect}
              className="w-full bg-[#242424] hover:bg-[#2A2A2A] text-white border border-gray-700 py-6 rounded-xl transition-all"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FF6B7A]/10 border border-[#FF6B7A]/30 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#FF6B7A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Web3 Wallets</p>
                    <p className="text-xs text-gray-400">MetaMask, Rainbow, WalletConnect</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#1A1A1A] text-gray-400">or</span>
              </div>
            </div>

            {/* Login via Wepin */}
            <Button
              onClick={handleWepinClick}
              className="w-full bg-[#242424] hover:bg-[#2A2A2A] text-white border border-gray-700 py-6 rounded-xl transition-all"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FF6B7A]/10 border border-[#FF6B7A]/30 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#FF6B7A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Login via Wepin</p>
                    <p className="text-xs text-gray-400">Social login (no seed phrase)</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Button>

            {/* Info Text */}
            <p className="text-xs text-gray-500 text-center px-4 pt-2">
              Choose your preferred wallet connection method
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wepin Provider Selection Modal */}
      <WepinProviderModal isOpen={showWepinModal} onClose={() => setShowWepinModal(false)} />
    </>
  );
}
