import { useState } from "react";
import { NetworkOptions } from "./NetworkOptions";
import { getAddress } from "viem";
import { Address } from "viem";
import { useAccount, useDisconnect } from "wagmi";
import {
  ArrowLeftOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { BlockieAvatar, isENS } from "~~/components/scaffold-eth";
import { Button } from "~~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~~/components/ui/dialog";
import { useCopyToClipboard } from "~~/hooks/scaffold-eth";
import { getTargetNetworks } from "~~/utils/scaffold-eth";

const BURNER_WALLET_ID = "burnerWallet";

const allowedNetworks = getTargetNetworks();

type AddressInfoModalProps = {
  address: Address;
  blockExplorerAddressLink: string | undefined;
  displayName: string;
  ensAvatar?: string;
};

export const AddressInfoModal = ({
  address,
  ensAvatar,
  displayName,
  blockExplorerAddressLink,
}: AddressInfoModalProps) => {
  const { disconnect } = useDisconnect();
  const { connector } = useAccount();
  const checkSumAddress = getAddress(address);

  const { copyToClipboard: copyAddressToClipboard, isCopiedToClipboard: isAddressCopiedToClipboard } =
    useCopyToClipboard();
  const [selectingNetwork, setSelectingNetwork] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#0F0F0F] hover:bg-[#1A1A1A] px-3 py-2 sm:px-4 sm:py-3 rounded-3xl shadow-md gap-2 h-auto text-white border border-gray-800 flex items-center justify-center w-full sm:w-auto">
          <BlockieAvatar address={checkSumAddress} size={24} ensImage={ensAvatar} />
          <span className="text-sm sm:text-base font-medium">
            {isENS(displayName) ? displayName : checkSumAddress?.slice(0, 6) + "..." + checkSumAddress?.slice(-4)}
          </span>
          <ChevronDownIcon className="h-5 w-5 flex-shrink-0" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1A1A1A] border border-gray-800 text-white sm:max-w-md w-[90vw] mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
            <BlockieAvatar address={checkSumAddress} size={32} ensImage={ensAvatar} />
            <span>Wallet Info</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {!selectingNetwork ? (
            <>
              {/* Copy Address */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-[#242424] hover:text-white transition-colors"
                onClick={() => copyAddressToClipboard(checkSumAddress)}
              >
                {isAddressCopiedToClipboard ? (
                  <>
                    <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Copied!</span>
                  </>
                ) : (
                  <>
                    <DocumentDuplicateIcon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm sm:text-base">Copy address</span>
                  </>
                )}
              </button>

              {/* View QR Code */}
              <label
                htmlFor="qrcode-modal"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-[#242424] hover:text-white transition-colors cursor-pointer"
                onClick={() => setIsOpen(false)}
              >
                <QrCodeIcon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">View QR Code</span>
              </label>

              {/* View on Block Explorer */}
              <a
                target="_blank"
                href={blockExplorerAddressLink}
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-[#242424] hover:text-white transition-colors"
              >
                <ArrowTopRightOnSquareIcon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">View on Block Explorer</span>
              </a>

              {/* Switch Network */}
              {allowedNetworks.length > 1 && (
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-[#242424] hover:text-white transition-colors"
                  onClick={() => setSelectingNetwork(true)}
                >
                  <ArrowsRightLeftIcon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Switch Network</span>
                </button>
              )}

              {/* Reveal Private Key (Burner Wallet only) */}
              {connector?.id === BURNER_WALLET_ID && (
                <label
                  htmlFor="reveal-burner-pk-modal"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors cursor-pointer"
                  onClick={() => setIsOpen(false)}
                >
                  <EyeIcon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm sm:text-base">Reveal Private Key</span>
                </label>
              )}

              {/* Disconnect */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
                onClick={() => {
                  disconnect();
                  setIsOpen(false);
                }}
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">Disconnect</span>
              </button>
            </>
          ) : (
            <>
              <NetworkOptions hidden={false} />
              <Button
                className="w-full mt-4 bg-[#242424] hover:bg-[#2a2a2a] text-white"
                onClick={() => setSelectingNetwork(false)}
              >
                Back
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
