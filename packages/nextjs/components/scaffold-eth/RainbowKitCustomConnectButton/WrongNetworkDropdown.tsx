import { NetworkOptions } from "./NetworkOptions";
import { useDisconnect } from "wagmi";
import { ArrowLeftOnRectangleIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export const WrongNetworkDropdown = () => {
  const { disconnect } = useDisconnect();

  return (
    <div className="dropdown dropdown-end mr-2">
      <label tabIndex={0} className="btn bg-red-600 hover:bg-red-700 text-white btn-sm dropdown-toggle gap-1 border-0">
        <span>Wrong network</span>
        <ChevronDownIcon className="h-6 w-4 ml-2 sm:ml-0" />
      </label>
      <ul
        tabIndex={0}
        className="dropdown-content menu p-2 mt-1 shadow-xl bg-[#1A1A1A] border border-gray-800 rounded-xl gap-1"
      >
        <NetworkOptions />
        <li>
          <button
            className="menu-item text-red-400 hover:bg-red-900/20 hover:text-red-300 btn-sm rounded-xl! flex gap-3 py-3 transition-colors px-2"
            type="button"
            onClick={() => disconnect()}
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-4 ml-2 sm:ml-0" />
            <span>Disconnect</span>
          </button>
        </li>
      </ul>
    </div>
  );
};
