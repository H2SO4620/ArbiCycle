import { createConfig, http } from "wagmi";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "@wagmi/connectors";
import { defineChain } from "viem";

// ── Robinhood Chain Testnet (Arbitrum Orbit) ──────────────────────────────────
// Official hackathon prize track — deploy here for reserved top-3 slot.
// Docs: https://docs.robinhood.com/chain · Faucet: https://faucet.testnet.chain.robinhood.com
export const robinhoodChain = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  testnet: true,
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_ROBINHOOD_RPC ?? "https://rpc.testnet.chain.robinhood.com"],
    },
    public: {
      http: ["https://rpc.testnet.chain.robinhood.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Explorer",
      url: "https://explorer.testnet.chain.robinhood.com",
    },
  },
});

const WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID;

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia, arbitrum, robinhoodChain],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "ArbiCycle" }),
    // Only register WalletConnect when a real Reown/WalletConnect Cloud project ID is
    // configured. With a placeholder/missing ID, the connector's preloadListings call
    // to the Reown explorer API returns an unexpected payload and crashes the app on mount.
    ...(WC_PROJECT_ID ? [walletConnect({ projectId: WC_PROJECT_ID })] : []),
  ],
  transports: {
    [arbitrumSepolia.id]: http(
      import.meta.env.VITE_ARB_SEPOLIA_RPC ?? "https://sepolia-rollup.arbitrum.io/rpc"
    ),
    [arbitrum.id]: http(
      import.meta.env.VITE_ARB_ONE_RPC ?? "https://arb1.arbitrum.io/rpc"
    ),
    [robinhoodChain.id]: http(
      import.meta.env.VITE_ROBINHOOD_RPC ?? "https://rpc.robinhoodchain.com"
    ),
  },
});

// ── Deployed contract addresses (fill in after deploy) ────────────────────────
export const CONTRACTS = {
  [arbitrumSepolia.id]: {
    factory:    (import.meta.env.VITE_FACTORY_SEPOLIA    ?? "0xbbAE2b7b65c9a9cFA350B6498411C8bD0288e2d1") as `0x${string}`,
    reputation: (import.meta.env.VITE_REPUTATION_SEPOLIA ?? "0xd4dF8e90e7962D3D057d15b5A0835473e0a048E8") as `0x${string}`,
    usdc:       "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as `0x${string}`,
  },
  [arbitrum.id]: {
    factory:    (import.meta.env.VITE_FACTORY_ONE    ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
    reputation: (import.meta.env.VITE_REPUTATION_ONE ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
    usdc:       "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" as `0x${string}`,
  },
  [robinhoodChain.id]: {
    factory:    (import.meta.env.VITE_FACTORY_ROBINHOOD    ?? "0x1B865921F47405aA03CbcC5AC9E7b3cf0326B779") as `0x${string}`,
    reputation: (import.meta.env.VITE_REPUTATION_ROBINHOOD ?? "0x4D169Da25286Dc372d2f32fe9E3A339A516Ba5d6") as `0x${string}`,
    // MockUSDC with open faucet() — USDC isn't live on Robinhood Chain testnet
    usdc:       (import.meta.env.VITE_USDC_ROBINHOOD ?? "0xb83D0b7eb2933eD7b1AAe05fEC28EeB3EBb604C1") as `0x${string}`,
  },
} as const;

export const SUPPORTED_CHAIN_IDS = [arbitrumSepolia.id, arbitrum.id, robinhoodChain.id] as const;
