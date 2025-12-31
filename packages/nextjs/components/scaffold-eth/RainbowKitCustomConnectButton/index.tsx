"use client";

// @refresh reset
import { useRef, useState } from "react";
import { Balance } from "../Balance";
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { AddressInfoModal } from "./AddressInfoModal";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { RevealBurnerPKModal } from "./RevealBurnerPKModal";
import { WalletSelectionModal } from "./WalletSelectionModal";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Address } from "viem";
import { Button } from "~~/components/ui/button";
import { useNetworkColor } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useWepin } from "~~/hooks/useWepin";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

/**
 * Custom Wagmi Connect Button (watch balance + custom design)
 * Now supports both Web3 wallets (via RainbowKit) and Wepin social login
 * @param bg - Background color class
 * @param useModal - If true, use modal instead of dropdown (better for mobile/drawer contexts)
 */
export const RainbowKitCustomConnectButton = ({ bg, useModal = false }: { bg: string; useModal?: boolean }) => {
  const networkColor = useNetworkColor();
  const { targetNetwork } = useTargetNetwork();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const rainbowKitOpenModalRef = useRef<(() => void) | null>(null);
  const { isConnected: wepinConnected, walletAddress: wepinAddress } = useWepin();

  return (
    <>
      <ConnectButton.Custom>
        {({ account, chain, openConnectModal, mounted }) => {
          // Store the openConnectModal function in a ref (no setState during render)
          if (openConnectModal && !rainbowKitOpenModalRef.current) {
            rainbowKitOpenModalRef.current = openConnectModal;
          }
          // Check if either Web3 wallet or Wepin is connected
          const web3Connected = mounted && account && chain;
          const anyConnected = web3Connected || wepinConnected;

          // Use Wepin address if connected via Wepin, otherwise use Web3 wallet address
          const displayAddress = wepinConnected ? wepinAddress : account?.address;
          const blockExplorerAddressLink = displayAddress
            ? getBlockExplorerAddressLink(targetNetwork, displayAddress)
            : undefined;

          return (
            <>
              {(() => {
                // Show connect button if neither wallet is connected
                if (!anyConnected) {
                  return (
                    <Button
                      className={`${bg} rounded-3xl text-xs sm:text-base py-2 sm:py-4 px-4 sm:px-6`}
                      onClick={() => setShowWalletModal(true)}
                      type="button"
                    >
                      Connect Wallet
                    </Button>
                  );
                }

                // Handle Wepin connection (Wepin doesn't support network switching)
                if (wepinConnected && wepinAddress) {
                  const AddressComponent = useModal ? AddressInfoModal : AddressInfoDropdown;
                  return (
                    <div className="flex items-center">
                      {!useModal && (
                        <div className="sm:flex flex-col items-center mr-1 hidden">
                          <Balance address={wepinAddress as Address} className="min-h-0 h-auto" />
                          <span className="text-xs" style={{ color: networkColor }}>
                            {targetNetwork.name} (Wepin)
                          </span>
                        </div>
                      )}
                      <AddressComponent
                        address={wepinAddress as Address}
                        displayName="Wepin Wallet"
                        blockExplorerAddressLink={blockExplorerAddressLink}
                      />
                      <AddressQRCodeModal address={wepinAddress as Address} modalId="qrcode-modal" />
                    </div>
                  );
                }

                // Handle Web3 wallet connection (RainbowKit)
                if (web3Connected) {
                  // Check for wrong network
                  if (chain.unsupported || chain.id !== targetNetwork.id) {
                    return <WrongNetworkDropdown />;
                  }

                  const AddressComponent = useModal ? AddressInfoModal : AddressInfoDropdown;
                  return (
                    <div className="flex items-center">
                      {!useModal && (
                        <div className="sm:flex flex-col items-center mr-1 hidden">
                          <Balance address={account.address as Address} className="min-h-0 h-auto" />
                          <span className="text-xs" style={{ color: networkColor }}>
                            {chain.name}
                          </span>
                        </div>
                      )}
                      <AddressComponent
                        address={account.address as Address}
                        displayName={account.displayName}
                        ensAvatar={account.ensAvatar}
                        blockExplorerAddressLink={blockExplorerAddressLink}
                      />
                      <AddressQRCodeModal address={account.address as Address} modalId="qrcode-modal" />
                      <RevealBurnerPKModal />
                    </div>
                  );
                }

                return null;
              })()}
            </>
          );
        }}
      </ConnectButton.Custom>

      {/* Wallet Selection Modal */}
      <WalletSelectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onWeb3WalletClick={() => {
          if (rainbowKitOpenModalRef.current) {
            rainbowKitOpenModalRef.current();
          }
        }}
      />
    </>
  );
};
