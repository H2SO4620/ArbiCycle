/**
 * ArbiCycle Off-chain Keeper
 *
 * This keeper is a fallback for when Chainlink Automation upkeep runs out of LINK.
 * It polls active circles every 5 minutes and calls triggerRotation() when due.
 *
 * In production, Chainlink Automation is the primary mechanism (trustless, decentralised).
 * This keeper adds an extra safety net.
 *
 * Usage:
 *   Copy .env.example to .env, fill in values, then run:
 *   npm run dev
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia, arbitrum } from "viem/chains";

// ── Config ────────────────────────────────────────────────────────────────────

const RPC_URL        = process.env.RPC_URL!;
const PRIVATE_KEY    = process.env.KEEPER_PRIVATE_KEY as `0x${string}`;
const FACTORY_ADDR   = process.env.FACTORY_ADDRESS as Address;
const CHAIN_ID       = Number(process.env.CHAIN_ID ?? 421614);
const POLL_INTERVAL  = Number(process.env.POLL_INTERVAL_MS ?? 300_000); // 5 min

if (!RPC_URL || !PRIVATE_KEY || !FACTORY_ADDR) {
  console.error("Missing required env vars: RPC_URL, KEEPER_PRIVATE_KEY, FACTORY_ADDRESS");
  process.exit(1);
}

const chain = CHAIN_ID === 42161 ? arbitrum : arbitrumSepolia;
const account = privateKeyToAccount(PRIVATE_KEY);

const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });
const walletClient = createWalletClient({ chain, transport: http(RPC_URL), account });

// ── ABIs (minimal) ────────────────────────────────────────────────────────────

const FACTORY_ABI = parseAbi([
  "function getAllCircles() view returns (address[])",
]);

const CIRCLE_ABI = parseAbi([
  "function state() view returns (uint8)",
  "function checkUpkeep(bytes) view returns (bool, bytes)",
  "function triggerRotation() external",
]);

// ── Main loop ─────────────────────────────────────────────────────────────────

async function tick() {
  console.log(`[${new Date().toISOString()}] Keeper tick`);

  let circles: Address[];
  try {
    circles = await publicClient.readContract({
      address: FACTORY_ADDR,
      abi: FACTORY_ABI,
      functionName: "getAllCircles",
    }) as Address[];
  } catch (err) {
    console.error("Failed to fetch circles:", err);
    return;
  }

  console.log(`  Checking ${circles.length} circle(s)…`);

  for (const circle of circles) {
    try {
      // Quick state check — skip non-active circles
      const state = await publicClient.readContract({
        address: circle, abi: CIRCLE_ABI, functionName: "state",
      });
      if (Number(state) !== 1) continue; // not ACTIVE

      const [upkeepNeeded] = await publicClient.readContract({
        address: circle, abi: CIRCLE_ABI, functionName: "checkUpkeep", args: ["0x"],
      }) as [boolean, `0x${string}`];

      if (!upkeepNeeded) {
        console.log(`  ⏳ ${circle} — not due yet`);
        continue;
      }

      console.log(`  🔄 ${circle} — triggering rotation…`);
      const hash = await walletClient.writeContract({
        address: circle,
        abi: CIRCLE_ABI,
        functionName: "triggerRotation",
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(`  ✅ ${circle} — rotation tx: ${receipt.transactionHash} (block ${receipt.blockNumber})`);
    } catch (err) {
      console.error(`  ❌ ${circle}:`, (err as Error).message);
    }
  }
}

// ── Entry ─────────────────────────────────────────────────────────────────────

console.log(`ArbiCycle Keeper starting on chain ${CHAIN_ID}`);
console.log(`  Factory: ${FACTORY_ADDR}`);
console.log(`  Keeper:  ${account.address}`);
console.log(`  Poll:    every ${POLL_INTERVAL / 1000}s\n`);

tick();
setInterval(tick, POLL_INTERVAL);
