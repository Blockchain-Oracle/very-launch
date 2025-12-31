import * as chains from "viem/chains";
import { anvilLocal, veryMainnet } from "~~/utils/customChains";

export type BaseConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  alchemyApiKey?: string;
  rpcOverrides?: Record<number, string>;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
};

export type ScaffoldConfig = BaseConfig;

const scaffoldConfig = {
  // The networks on which your DApp is live
  targetNetworks: [anvilLocal, veryMainnet], // Support both local development and Very Network
  // The interval at which your front-end polls the RPC servers for new data
  pollingInterval: 30000,
  // Alchemy API key (optional - not needed for Very Network)
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  // RPC overrides for specific chains (Very Network uses its own RPC)
  rpcOverrides: {},
  // WalletConnect project ID for wallet connections
  // Get your own at https://cloud.walletconnect.com
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",
  onlyLocalBurnerWallet: true,
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
