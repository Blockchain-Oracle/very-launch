"use client";

import { useState } from "react";
import { getAddress } from "viem";
import { Address } from "viem";
import {
  ArrowLeftOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { Button } from "~~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~~/components/ui/dialog";
import { useCopyToClipboard } from "~~/hooks/scaffold-eth";
import { useWepin } from "~~/hooks/useWepin";

type WepinAddressModalProps = {
  address: Address;
  blockExplorerAddressLink: string | undefined;
};

/**
 * Wepin-specific address modal (for mobile/drawer contexts)
 * - No network switching (Wepin is always on Very chain)
 * - Uses Wepin disconnect instead of wagmi
 */
export const WepinAddressModal = ({ address, blockExplorerAddressLink }: WepinAddressModalProps) => {
  const { disconnect } = useWepin();
  const checkSumAddress = getAddress(address);

  const { copyToClipboard: copyAddressToClipboard, isCopiedToClipboard: isAddressCopiedToClipboard } =
    useCopyToClipboard();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#0F0F0F] hover:bg-[#1A1A1A] px-3 py-2 sm:px-4 sm:py-3 rounded-3xl shadow-md gap-2 h-auto text-white border border-gray-800 flex items-center justify-center w-full sm:w-auto">
          <BlockieAvatar address={checkSumAddress} size={24} />
          <span className="text-sm sm:text-base font-medium">
            {checkSumAddress?.slice(0, 6) + "..." + checkSumAddress?.slice(-4)}
          </span>
          <ChevronDownIcon className="h-5 w-5 flex-shrink-0" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1A1A1A] border border-gray-800 text-white sm:max-w-md w-[90vw] mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl text-white flex items-center gap-2">
            <BlockieAvatar address={checkSumAddress} size={32} />
            <div className="flex flex-col">
              <span>Wepin Wallet</span>
              <span className="text-xs text-gray-400 font-normal">Very Network</span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-4">
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

          {/* Disconnect - Uses Wepin disconnect */}
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
