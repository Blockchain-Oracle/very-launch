"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Dynamic types for CSR-only imports
type WepinSDK = any;
type WepinLogin = any;
type WepinProvider = any;

interface WepinState {
  isInitialized: boolean;
  isConnected: boolean;
  walletAddress: string | null;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
  chainId: number | null;
}

interface WepinContextValue extends WepinState {
  connect: (provider?: "google" | "apple" | "naver" | "discord") => Promise<void>;
  disconnect: () => Promise<void>;
  getProvider: (network: "evmvery" | "ethereum") => Promise<any>;
  signMessage: (message: string) => Promise<string | null>;
  sendTransaction: (params: { to: string; value?: string; data?: string }) => Promise<string | null>;
}

const WepinContext = createContext<WepinContextValue | null>(null);

export function WepinProvider({ children }: { children: React.ReactNode }) {
  const [wepinSDK, setWepinSDK] = useState<WepinSDK | null>(null);
  const [wepinLogin, setWepinLogin] = useState<WepinLogin | null>(null);
  const [wepinProvider, setWepinProvider] = useState<WepinProvider | null>(null);
  const [currentProvider, setCurrentProvider] = useState<any | null>(null);
  const [state, setState] = useState<WepinState>({
    isInitialized: false,
    isConnected: false,
    walletAddress: null,
    userId: null,
    isLoading: true,
    error: null,
    chainId: null,
  });

  // Initialize Wepin SDKs (CSR-compatible for Next.js)
  useEffect(() => {
    const initWepin = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Dynamic imports for CSR compatibility
        const [{ WepinSDK }, { WepinLogin }, { WepinProvider }] = await Promise.all([
          import("@wepin/sdk-js"),
          import("@wepin/login-js"),
          import("@wepin/provider-js"),
        ]);

        const appId = process.env.NEXT_PUBLIC_WEPIN_APP_ID || "";
        const appKey = process.env.NEXT_PUBLIC_WEPIN_APP_KEY || "";

        if (!appId || !appKey) {
          throw new Error(
            "Wepin App ID and App Key are required. Please set NEXT_PUBLIC_WEPIN_APP_ID and NEXT_PUBLIC_WEPIN_APP_KEY environment variables.",
          );
        }

        // Initialize Login SDK first
        const login = new WepinLogin({
          appId,
          appKey,
        });
        await login.init("en");

        // Initialize Provider SDK
        const provider = new WepinProvider({
          appId,
          appKey,
        });
        await provider.init({
          defaultLanguage: "en",
          defaultCurrency: "USD",
        });

        // Initialize Widget SDK
        const sdk = new WepinSDK({
          appId,
          appKey,
        });

        await sdk.init({
          type: "hide",
          defaultLanguage: "en",
          defaultCurrency: "USD",
          loginProviders: ["google", "apple"],
        });

        setWepinLogin(login);
        setWepinProvider(provider);
        setWepinSDK(sdk);
        setState(prev => ({
          ...prev,
          isInitialized: true,
          isLoading: false,
        }));
      } catch (error) {
        console.error("Failed to initialize Wepin:", error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to initialize Wepin wallet",
        }));
      }
    };

    // Only initialize on client side
    if (typeof window !== "undefined") {
      initWepin();
    }
  }, []);

  // Get provider for specific network
  const getProvider = useCallback(
    async (network: "evmvery" | "ethereum") => {
      if (!wepinProvider || !state.isInitialized) {
        throw new Error("Wepin provider not initialized");
      }

      try {
        const provider = await wepinProvider.getProvider(network);
        setCurrentProvider(provider);
        return provider;
      } catch (error) {
        console.error("Failed to get provider:", error);
        throw error;
      }
    },
    [wepinProvider, state.isInitialized],
  );

  // Connect wallet and authenticate
  const connect = useCallback(
    async (provider: "google" | "apple" | "naver" | "discord" = "google") => {
      if (!wepinLogin || !wepinSDK || !wepinProvider || !state.isInitialized) {
        setState(prev => ({ ...prev, error: "Wepin not initialized" }));
        return;
      }

      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Step 1: OAuth login to get tokens
        const oauthResult = await wepinLogin.loginWithOauthProvider({
          provider,
        });

        if (!oauthResult) {
          throw new Error("OAuth login failed");
        }

        // Step 2: Login to Wepin
        const userInfo = await wepinLogin.loginWepin(oauthResult);

        if (!userInfo) {
          throw new Error("Failed to login to Wepin");
        }

        // Step 3: Handle registration if needed
        if (
          userInfo.userStatus?.loginStatus === "pinRequired" ||
          userInfo.userStatus?.loginStatus === "registerRequired"
        ) {
          console.log("Opening Wepin registration for:", userInfo.userStatus.loginStatus);
          await wepinSDK.register();
        } else if (userInfo.userStatus?.loginStatus !== "complete") {
          throw new Error(`Unexpected login status: ${userInfo.userStatus?.loginStatus}`);
        }

        // Step 4: Get wallet accounts (without filters - they cause empty results)
        const accounts = await wepinSDK.getAccounts();

        console.log("Wepin accounts:", accounts);

        // Find EVM-compatible account (check multiple network name variations)
        const evmAccount = accounts.find(
          (acc: any) =>
            acc.network === "Ethereum" ||
            acc.network === "Verychain" ||
            acc.network === "Very" ||
            acc.network === "evmVERY" ||
            acc.network === "evmvery" ||
            // Fallback: any account with an EVM address
            (acc.address && acc.address.startsWith("0x")),
        );

        if (!evmAccount || !evmAccount.address) {
          console.error("No EVM account found. Available accounts:", accounts);
          throw new Error("No EVM-compatible account found");
        }

        const walletAddress = evmAccount.address;

        // Step 5: Get provider for evmvery (hardcoded for Very Network)
        const ethereumProvider = await wepinProvider.getProvider("evmvery");
        setCurrentProvider(ethereumProvider);

        // Step 6: Request account authorization (EIP-1193)
        const authorizedAccounts = await ethereumProvider.request({
          method: "eth_requestAccounts",
          params: [],
        });
        console.log("Provider authorized accounts:", authorizedAccounts);

        // Step 7: Get chain ID
        const chainIdHex = await ethereumProvider.request({
          method: "eth_chainId",
          params: [],
        });
        const chainId = parseInt(chainIdHex, 16);

        // Step 8: Update state
        setState(prev => ({
          ...prev,
          isConnected: true,
          walletAddress,
          userId: userInfo.userInfo?.userId || null,
          chainId,
          isLoading: false,
        }));
      } catch (error) {
        console.error("Failed to connect Wepin wallet:", error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to connect wallet",
        }));
      }
    },
    [wepinLogin, wepinSDK, wepinProvider, state.isInitialized],
  );

  // Sign message using Wepin provider
  const signMessage = useCallback(
    async (message: string): Promise<string | null> => {
      if (!currentProvider || !state.walletAddress) {
        console.error("Provider or wallet address not available");
        return null;
      }

      try {
        const signature = await currentProvider.request({
          method: "personal_sign",
          params: [message, state.walletAddress],
        });

        return signature;
      } catch (error) {
        console.error("Failed to sign message:", error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to sign message",
        }));
        return null;
      }
    },
    [currentProvider, state.walletAddress],
  );

  // Send transaction using Wepin provider
  const sendTransaction = useCallback(
    async (params: { to: string; value?: string; data?: string }): Promise<string | null> => {
      if (!currentProvider || !state.walletAddress) {
        console.error("Provider or wallet address not available");
        return null;
      }

      try {
        const txHash = await currentProvider.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: state.walletAddress,
              to: params.to,
              value: params.value || "0x0",
              data: params.data || "0x",
            },
          ],
        });

        return txHash;
      } catch (error) {
        console.error("Failed to send transaction:", error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to send transaction",
        }));
        return null;
      }
    },
    [currentProvider, state.walletAddress],
  );

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    if (!wepinLogin) return;

    try {
      await wepinLogin.logout();
      setCurrentProvider(null);
      setState(prev => ({
        ...prev,
        isConnected: false,
        walletAddress: null,
        userId: null,
        chainId: null,
      }));
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to disconnect wallet",
      }));
    }
  }, [wepinLogin]);

  const value: WepinContextValue = {
    ...state,
    connect,
    disconnect,
    getProvider,
    signMessage,
    sendTransaction,
  };

  return <WepinContext.Provider value={value}>{children}</WepinContext.Provider>;
}

export function useWepin(): WepinContextValue {
  const context = useContext(WepinContext);
  if (!context) {
    throw new Error("useWepin must be used within a WepinProvider");
  }
  return context;
}
