import { Address } from "viem";
import { useContractLogs } from "~~/hooks/scaffold-eth";
import { replacer } from "~~/utils/scaffold-eth/common";

export const AddressLogsTab = ({ address }: { address: Address }) => {
  const contractLogs = useContractLogs(address);

  return (
    <div className="flex flex-col gap-3 p-4 text-white">
      <div className="mockup-code overflow-auto max-h-[500px] bg-[#1A1A1A] border border-gray-700">
        <pre className="px-5 whitespace-pre-wrap break-words text-gray-300">
          {contractLogs.map((log, i) => (
            <div key={i} className="text-gray-300">
              <strong className="text-white">Log:</strong> {JSON.stringify(log, replacer, 2)}
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
};
