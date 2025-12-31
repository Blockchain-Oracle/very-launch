import { useRef, useState } from "react";
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
import { useCopyToClipboard, useOutsideClick } from "~~/hooks/scaffold-eth";
import { getTargetNetworks } from "~~/utils/scaffold-eth";

const BURNER_WALLET_ID = "burnerWallet";

const allowedNetworks = getTargetNetworks();

type AddressInfoDropdownProps = {
  address: Address;
  blockExplorerAddressLink: string | undefined;
  displayName: string;
  ensAvatar?: string;
};

export const AddressInfoDropdown = ({
  address,
  ensAvatar,
  displayName,
  blockExplorerAddressLink,
}: AddressInfoDropdownProps) => {
  const { disconnect } = useDisconnect();
  const { connector } = useAccount();
  const checkSumAddress = getAddress(address);

  const { copyToClipboard: copyAddressToClipboard, isCopiedToClipboard: isAddressCopiedToClipboard } =
    useCopyToClipboard();
  const [selectingNetwork, setSelectingNetwork] = useState(false);
  const dropdownRef = useRef<HTMLDetailsElement>(null);

  const closeDropdown = () => {
    setSelectingNetwork(false);
    dropdownRef.current?.removeAttribute("open");
  };

  useOutsideClick(dropdownRef, closeDropdown);

  return (
    <>
      <details ref={dropdownRef} className="dropdown dropdown-end leading-3">
        <summary className="btn bg-[#0F0F0F] hover:bg-[#1A1A1A] px-1.5 py-1 sm:px-3 sm:py-2 rounded-3xl btn-xs sm:btn-sm shadow-md dropdown-toggle gap-0 h-auto text-white border border-gray-800 flex items-center">
          <BlockieAvatar address={checkSumAddress} size={20} ensImage={ensAvatar} />
          <span className="ml-1 sm:ml-2 mr-0.5 sm:mr-1 text-[10px] sm:text-sm hidden min-[380px]:inline">
            {isENS(displayName) ? displayName : checkSumAddress?.slice(0, 6) + "..." + checkSumAddress?.slice(-4)}
          </span>
          <span className="ml-1 sm:ml-2 mr-0.5 sm:mr-1 text-[10px] sm:text-sm min-[380px]:hidden">
            {checkSumAddress?.slice(0, 4) + "..." + checkSumAddress?.slice(-3)}
          </span>
          <ChevronDownIcon className="h-4 w-4 sm:h-5 sm:w-5 ml-0.5 sm:ml-1 flex-shrink-0" />
        </summary>
        <ul className="dropdown-content menu z-[100] p-2 mt-2 bg-[#1A1A1A] border border-gray-800 rounded-xl gap-1 shadow-xl w-56 sm:w-auto min-w-[200px] right-0">
          <NetworkOptions hidden={!selectingNetwork} />
          <li className={selectingNetwork ? "hidden" : ""}>
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
          <li className={selectingNetwork ? "hidden" : ""}>
            <label
              htmlFor="qrcode-modal"
              className="h-10 sm:h-8 btn-sm rounded-xl! flex gap-2 sm:gap-3 py-2 sm:py-3 text-gray-300 hover:bg-[#242424] hover:text-white transition-colors px-3 cursor-pointer text-sm sm:text-base"
            >
              <QrCodeIcon className="h-5 w-5 sm:h-6 sm:w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">View QR Code</span>
            </label>
          </li>
          <li className={selectingNetwork ? "hidden" : ""}>
            <button
              className="h-10 sm:h-8 btn-sm rounded-xl! flex gap-2 sm:gap-3 py-2 sm:py-3 text-gray-300 hover:bg-[#242424] hover:text-white transition-colors px-3 text-sm sm:text-base"
              type="button"
            >
              <ArrowTopRightOnSquareIcon className="h-5 w-5 sm:h-6 sm:w-4 flex-shrink-0" />
              <a
                target="_blank"
                href={blockExplorerAddressLink}
                rel="noopener noreferrer"
                className="whitespace-nowrap"
              >
                View on Block Explorer
              </a>
            </button>
          </li>
          {allowedNetworks.length > 1 ? (
            <li className={selectingNetwork ? "hidden" : ""}>
              <button
                className="h-10 sm:h-8 btn-sm rounded-xl! flex gap-2 sm:gap-3 py-2 sm:py-3 text-gray-300 hover:bg-[#242424] hover:text-white transition-colors px-3 text-sm sm:text-base"
                type="button"
                onClick={() => {
                  setSelectingNetwork(true);
                }}
              >
                <ArrowsRightLeftIcon className="h-5 w-5 sm:h-6 sm:w-4 flex-shrink-0" /> <span>Switch Network</span>
              </button>
            </li>
          ) : null}
          {connector?.id === BURNER_WALLET_ID ? (
            <li>
              <label
                htmlFor="reveal-burner-pk-modal"
                className="h-10 sm:h-8 btn-sm rounded-xl! flex gap-2 sm:gap-3 py-2 sm:py-3 text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors px-3 cursor-pointer text-sm sm:text-base"
              >
                <EyeIcon className="h-5 w-5 sm:h-6 sm:w-4 flex-shrink-0" />
                <span>Reveal Private Key</span>
              </label>
            </li>
          ) : null}
          <li className={selectingNetwork ? "hidden" : ""}>
            <button
              className="menu-item text-red-400 hover:bg-red-900/20 hover:text-red-300 h-10 sm:h-8 btn-sm rounded-xl! flex gap-2 sm:gap-3 py-2 sm:py-3 transition-colors px-3 text-sm sm:text-base"
              type="button"
              onClick={() => disconnect()}
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5 sm:h-6 sm:w-4 flex-shrink-0" /> <span>Disconnect</span>
            </button>
          </li>
        </ul>
      </details>
    </>
  );
};
