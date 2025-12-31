"use client";

import { useEffect, useState } from "react";
import { AddressCodeTab } from "./AddressCodeTab";
import { AddressLogsTab } from "./AddressLogsTab";
import { AddressStorageTab } from "./AddressStorageTab";
import { PaginationButton } from "./PaginationButton";
import { TransactionsTable } from "./TransactionsTable";
import { Address, createPublicClient, http } from "viem";
import { hardhat } from "viem/chains";
import { useFetchBlocks } from "~~/hooks/scaffold-eth";

type AddressCodeTabProps = {
  bytecode: string;
  assembly: string;
};

type PageProps = {
  address: Address;
  contractData: AddressCodeTabProps | null;
};

const publicClient = createPublicClient({
  chain: hardhat,
  transport: http(),
});

export const ContractTabs = ({ address, contractData }: PageProps) => {
  const { blocks, transactionReceipts, currentPage, totalBlocks, setCurrentPage } = useFetchBlocks();
  const [activeTab, setActiveTab] = useState("transactions");
  const [isContract, setIsContract] = useState(false);

  useEffect(() => {
    const checkIsContract = async () => {
      const contractCode = await publicClient.getBytecode({ address: address });
      setIsContract(contractCode !== undefined && contractCode !== "0x");
    };

    checkIsContract();
  }, [address]);

  const filteredBlocks = blocks.filter(block =>
    block.transactions.some(tx => {
      if (typeof tx === "string") {
        return false;
      }
      return tx.from.toLowerCase() === address.toLowerCase() || tx.to?.toLowerCase() === address.toLowerCase();
    }),
  );

  return (
    <>
      {isContract && (
        <div role="tablist" className="tabs tabs-lifted bg-[#1A1A1A]">
          <button
            role="tab"
            className={`tab text-white ${activeTab === "transactions" ? "tab-active bg-[#FF6B7A] text-white" : "bg-[#242424] hover:bg-[#2A2A2A]"}`}
            onClick={() => setActiveTab("transactions")}
          >
            Transactions
          </button>
          <button
            role="tab"
            className={`tab text-white ${activeTab === "code" ? "tab-active bg-[#FF6B7A] text-white" : "bg-[#242424] hover:bg-[#2A2A2A]"}`}
            onClick={() => setActiveTab("code")}
          >
            Code
          </button>
          <button
            role="tab"
            className={`tab text-white ${activeTab === "storage" ? "tab-active bg-[#FF6B7A] text-white" : "bg-[#242424] hover:bg-[#2A2A2A]"}`}
            onClick={() => setActiveTab("storage")}
          >
            Storage
          </button>
          <button
            role="tab"
            className={`tab text-white ${activeTab === "logs" ? "tab-active bg-[#FF6B7A] text-white" : "bg-[#242424] hover:bg-[#2A2A2A]"}`}
            onClick={() => setActiveTab("logs")}
          >
            Logs
          </button>
        </div>
      )}
      {activeTab === "transactions" && (
        <div className="pt-4">
          <TransactionsTable blocks={filteredBlocks} transactionReceipts={transactionReceipts} />
          <PaginationButton
            currentPage={currentPage}
            totalItems={Number(totalBlocks)}
            setCurrentPage={setCurrentPage}
          />
        </div>
      )}
      {activeTab === "code" && contractData && (
        <AddressCodeTab bytecode={contractData.bytecode} assembly={contractData.assembly} />
      )}
      {activeTab === "storage" && <AddressStorageTab address={address} />}
      {activeTab === "logs" && <AddressLogsTab address={address} />}
    </>
  );
};
