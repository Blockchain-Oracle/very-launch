import { defineChain } from "viem";

// Very Network Mainnet (Chain ID: 4613)
export const veryMainnet = /*#__PURE__*/ defineChain({
  id: 4613,
  name: "Very Network",
  nativeCurrency: { name: "Very", symbol: "VERY", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["https://rpc.verylabs.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Very Explorer",
      url: "https://explorer.verylabs.io",
    },
  },
  testnet: false,
});

// Anvil Local Testnet (Chain ID: 31337)
export const anvilLocal = /*#__PURE__*/ defineChain({
  id: 31337,
  name: "Anvil Local",
  nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
  testnet: true,
});
