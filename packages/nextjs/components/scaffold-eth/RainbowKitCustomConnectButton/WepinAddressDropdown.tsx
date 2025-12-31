"use client";

import { useRef } from "react";
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
import { useCopyToClipboard, useOutsideClick } from "~~/hooks/scaffold-eth";
import { useWepin } from "~~/hooks/useWepin";

type WepinAddressDropdownProps = {
  address: Address;
  blockExplorerAddressLink: string | undefined;
};

/**
 * Wepin-specific address dropdown
 * - No network switching (Wepin is always on Very chain)
 * - Uses Wepin disconnect instead of wagmi
 */
export const WepinAddressDropdown = ({ address, blockExplorerAddressLink }: WepinAddressDropdownProps) => {
  const { disconnect } = useWepin();
  const checkSumAddress = getAddress(address);

  const { copyToClipboard: copyAddressToClipboard, isCopiedToClipboard: isAddressCopiedToClipboard } =
    useCopyToClipboard();
  const dropdownRef = useRef<HTMLDetailsElement>(null);

  const closeDropdown = () => {
    dropdownRef.current?.removeAttribute("open");
  };

  useOutsideClick(dropdownRef, closeDropdown);

  return (
    <details ref={dropdownRef} className="dropdown dropdown-end leading-3">
      <summary className="btn bg-[#0F0F0F] hover:bg-[#1A1A1A] px-1.5 py-1 sm:px-3 sm:py-2 rounded-3xl btn-xs sm:btn-sm shadow-md dropdown-toggle gap-0 h-auto text-white border border-gray-800 flex items-center">
        <BlockieAvatar address={checkSumAddress} size={20} />
        <span className="ml-1 sm:ml-2 mr-0.5 sm:mr-1 text-[10px] sm:text-sm hidden min-[380px]:inline">
          {checkSumAddress?.slice(0, 6) + "..." + checkSumAddress?.slice(-4)}
        </span>
        <span className="ml-1 sm:ml-2 mr-0.5 sm:mr-1 text-[10px] sm:text-sm min-[380px]:hidden">
          {checkSumAddress?.slice(0, 4) + "..." + checkSumAddress?.slice(-3)}
        </span>
        <ChevronDownIcon className="h-4 w-4 sm:h-5 sm:w-5 ml-0.5 sm:ml-1 flex-shrink-0" />
      </summary>
      <ul className="dropdown-content menu z-[100] p-2 mt-2 bg-[#1A1A1A] border border-gray-800 rounded-xl gap-1 shadow-xl w-56 sm:w-auto min-w-[200px] right-0">
        {/* Copy Address */}
        <li>
          <div
            className="h-10 sm:h-8 btn-sm rounded-xl! flex gap-2 sm:gap-3 py-2 sm:py-3 cursor-pointer text-gray-300 hover:bg-[#242424] hover:text-white transition-colors px-3 text-sm sm:text-base"
            onClick={() => copyAddressToClipboard(checkSumAddress)}
          >
            {isAddressCopiedToClipboard ? (
              <>
                <CheckCircleIcon className="text-xl font-normal h-6 w-4 ml-2 sm:ml-0" aria-hidden="true" />
                <span className="whitespace-nowrap">Copied!</span>
              </>
            ) : (
              <>
                <DocumentDuplicateIcon className="text-xl font-normal h-6 w-4 ml-2 sm:ml-0" aria-hidden="true" />
                <span className="whitespace-nowrap">Copy address</span>
              </>
            )}
          </div>
        </li>

        {/* View QR Code */}
        <li>
          <label
            htmlFor="qrcode-modal"
            className="h-10 sm:h-8 btn-sm rounded-xl! flex gap-2 sm:gap-3 py-2 sm:py-3 text-gray-300 hover:bg-[#242424] hover:text-white transition-colors px-3 cursor-pointer text-sm sm:text-base"
          >
            <QrCodeIcon className="h-5 w-5 sm:h-6 sm:w-4 flex-shrink-0" />
            <span className="whitespace-nowrap">View QR Code</span>
          </label>
        </li>

        {/* View on Block Explorer */}
        <li>
          <button
            className="h-10 sm:h-8 btn-sm rounded-xl! flex gap-2 sm:gap-3 py-2 sm:py-3 text-gray-300 hover:bg-[#242424] hover:text-white transition-colors px-3 text-sm sm:text-base"
            type="button"
          >
            <ArrowTopRightOnSquareIcon className="h-5 w-5 sm:h-6 sm:w-4 flex-shrink-0" />
            <a target="_blank" href={blockExplorerAddressLink} rel="noopener noreferrer" className="whitespace-nowrap">
              View on Block Explorer
            </a>
          </button>
        </li>

        {/* Disconnect - Uses Wepin disconnect */}
        <li>
          <button
            className="menu-item text-red-400 hover:bg-red-900/20 hover:text-red-300 h-10 sm:h-8 btn-sm rounded-xl! flex gap-2 sm:gap-3 py-2 sm:py-3 transition-colors px-3 text-sm sm:text-base"
            type="button"
            onClick={() => {
              disconnect();
              closeDropdown();
            }}
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 sm:h-6 sm:w-4 flex-shrink-0" />
            <span>Disconnect</span>
          </button>
        </li>
      </ul>
    </details>
  );
};
