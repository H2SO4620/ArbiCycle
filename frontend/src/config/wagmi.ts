import { createConfig, http } from "wagmi";
import { arbitrum, arbitrumSepolia } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "@wagmi/connectors";
import { defineChain } from "viem";

// ── Robinhood Chain (Arbitrum Orbit L3) ───────────────────────────────────────
// Official hackathon prize track — deploy here for reserved top-3 slot.
// TODO: verify chain ID + RPC at https://developer.robinhoodchain.com
export const robinhoodChain = defineChain({
  id: 1996,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_ROBINHOOD_RPC ?? "https://rpc.robinhoodchain.com"],
    },
    public: {
      http: ["https://rpc.robinhoodchain.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Explorer",
      url: "https://explorer.robinhoodchain.com",
    },
  },
});

const WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID ?? "arbicycle-dev";

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia, arbitrum, robinhoodChain],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "ArbiCycle" }),
    walletConnect({ projectId: WC_PROJECT_ID }),
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
    factory:    (import.meta.env.VITE_FACTORY_ROBINHOOD    ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
    reputation: (import.meta.env.VITE_REPUTATION_ROBINHOOD ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
    // TODO: update with actual bridged USDC address on Robinhood Chain
    usdc:       (import.meta.env.VITE_USDC_ROBINHOOD ?? "0x0000000000000000000000000000000000000000") as `0x${string}`,
  },
} as const;

export const SUPPORTED_CHAIN_IDS = [arbitrumSepolia.id, arbitrum.id, robinhoodChain.id] as const;
