// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ArbiCycleCircle} from "../src/ArbiCycleCircle.sol";
import {CircleFactory}   from "../src/CircleFactory.sol";
import {ReputationModule} from "../src/ReputationModule.sol";
import {MockUSDC, MockAavePool} from "../src/mocks/Mocks.sol";

/**
 * @notice ArbiCycle deployment script.
 *
 * Supported chains:
 *   421614  — Arbitrum Sepolia  (testnet, Chainlink VRF v2.5 live)
 *   42161   — Arbitrum One      (mainnet, Chainlink VRF v2.5 live)
 *   1996    — Robinhood Chain   (Arbitrum Orbit L3, VRF fallback = block-hash)
 *
 * Usage:
 *   # Arbitrum Sepolia
 *   forge script script/Deploy.s.sol --rpc-url $ARB_SEPOLIA_RPC --broadcast --verify
 *
 *   # Arbitrum One
 *   forge script script/Deploy.s.sol --rpc-url $ARB_ONE_RPC --broadcast --verify
 *
 *   # Robinhood Chain (no --verify until explorer is configured)
 *   forge script script/Deploy.s.sol --rpc-url $ROBINHOOD_RPC --broadcast
 *
 * After deploy on Arbitrum Sepolia/One:
 *   1. Create a Chainlink VRF subscription at https://vrf.chain.link
 *   2. Fund with LINK
 *   3. Add the CircleFactory address as a consumer
 *   4. Update VITE_VRF_SUB_ID in frontend/.env
 *
 * After deploy on any chain:
 *   Register Chainlink Automation at https://automation.chain.link
 *   (register each circle individually as a Custom Logic upkeep)
 */
contract Deploy is Script {

    // ── Arbitrum Sepolia ──────────────────────────────────────────────────────
    address constant USDC_SEPOLIA       = 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d;
    address constant AAVE_POOL_SEPOLIA  = 0xBfC91D59fdAA134A4ED45f7B584cAf96D7792Eff;
    address constant AUSDC_SEPOLIA      = 0x460b97BD498E1157530AEb3086301d5225b91216;
    // Chainlink VRF v2.5 — Arbitrum Sepolia
    // Verify latest at: https://docs.chain.link/vrf/v2-5/supported-networks#arbitrum-sepolia
    address constant VRF_COORD_SEPOLIA  = 0x5CE8D5A2BC84beb22a398CCA51996F7930313D61;
    bytes32 constant VRF_KEYHASH_SEPOLIA = 0x027f94ff1465b3525f9fc03e9ff7d6d2c0953482246dd6ae07570c45d6631414;

    // ── Arbitrum One ──────────────────────────────────────────────────────────
    address constant USDC_ONE       = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831;
    address constant AAVE_POOL_ONE  = 0x794a61358D6845594F94dc1DB02A252b5b4814aD;
    address constant AUSDC_ONE      = 0x625E7708f30cA75bfd92586e17077590C60eb4cD;
    // Chainlink VRF v2.5 — Arbitrum One
    // Verify latest at: https://docs.chain.link/vrf/v2-5/supported-networks#arbitrum-mainnet
    address constant VRF_COORD_ONE  = 0x41034678D6C633D8a95c75e1138A360a28bA15d1;
    bytes32 constant VRF_KEYHASH_ONE = 0x72d2b016bb5b62912afea355ebf33b91319f828738b111b723b309bbd0b8df67;

    // ── Robinhood Chain Testnet (Arbitrum Orbit L2) ──────────────────────────
    // Chain ID: 46630 · RPC: https://rpc.testnet.chain.robinhood.com
    // Explorer: https://explorer.testnet.chain.robinhood.com
    // USDC and Aave v3 are not live on Robinhood Chain testnet, so the script
    // deploys MockUSDC (open faucet) + MockAavePool there.
    // VRF not available on Robinhood Chain → address(0) = block-hash fallback

    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer    = vm.addr(deployerKey);

        // ── Select chain-specific addresses ──────────────────────────────────
        address usdcAddr;
        address aavePoolAddr;
        address aUsdcAddr;
        address vrfCoord;
        bytes32 vrfKeyHash;
        uint256 vrfSubId = vm.envOr("VRF_SUBSCRIPTION_ID", uint256(0));

        if (block.chainid == 421614) {
            console2.log("Deploying to Arbitrum Sepolia...");
            usdcAddr     = USDC_SEPOLIA;
            aavePoolAddr = AAVE_POOL_SEPOLIA;
            aUsdcAddr    = AUSDC_SEPOLIA;
            vrfCoord     = VRF_COORD_SEPOLIA;
            vrfKeyHash   = VRF_KEYHASH_SEPOLIA;

        } else if (block.chainid == 42161) {
            console2.log("Deploying to Arbitrum One...");
            usdcAddr     = USDC_ONE;
            aavePoolAddr = AAVE_POOL_ONE;
            aUsdcAddr    = AUSDC_ONE;
            vrfCoord     = VRF_COORD_ONE;
            vrfKeyHash   = VRF_KEYHASH_ONE;

        } else if (block.chainid == 46630) {
            console2.log("Deploying to Robinhood Chain Testnet...");
            console2.log("NOTE: VRF disabled - using block-hash shuffle fallback");
            console2.log("NOTE: Deploying MockUSDC + MockAavePool (no USDC/Aave on this chain yet)");

            vm.startBroadcast(deployerKey);
            MockUSDC mockUsdc     = new MockUSDC();
            MockAavePool mockPool = new MockAavePool(address(mockUsdc));
            // Seed the pool so withdrawals always have liquidity
            mockUsdc.mint(address(mockPool), 10_000_000e6);
            // Faucet the deployer for demos
            mockUsdc.mint(deployer, 100_000e6);
            vm.stopBroadcast();

            console2.log("MockUSDC:        ", address(mockUsdc));
            console2.log("MockAavePool:    ", address(mockPool));
            console2.log("MockAUsdc:       ", address(mockPool.aUsdc()));

            usdcAddr     = address(mockUsdc);
            aavePoolAddr = address(mockPool);
            aUsdcAddr    = address(mockPool.aUsdc());
            vrfCoord     = address(0); // block-hash fallback
            vrfKeyHash   = bytes32(0);
            vrfSubId     = 0;

        } else {
            revert("Unsupported chain - add config above");
        }

        vm.startBroadcast(deployerKey);

        // 1. Deploy ReputationModule
        ReputationModule reputation = new ReputationModule(deployer);
        console2.log("ReputationModule:", address(reputation));

        // 2. Deploy circle implementation (EIP-1167 master copy — never used directly)
        ArbiCycleCircle circleImpl = new ArbiCycleCircle();
        console2.log("CircleImpl:      ", address(circleImpl));

        // 3. Deploy factory (owns reputation module, holds VRF config)
        CircleFactory factory = new CircleFactory(
            address(circleImpl),
            address(reputation),
            usdcAddr,
            aavePoolAddr,
            aUsdcAddr,
            deployer,
            vrfCoord,
            vrfSubId,
            vrfKeyHash
        );
        console2.log("CircleFactory:   ", address(factory));

        // 4. Transfer reputation ownership to factory so it can authorise circles
        reputation.transferOwnership(address(factory));
        console2.log("ReputationModule ownership -> CircleFactory");

        vm.stopBroadcast();

        // ── Summary ───────────────────────────────────────────────────────────
        console2.log("\n========================================");
        console2.log("   ARBICYCLE DEPLOYMENT SUMMARY");
        console2.log("========================================");
        console2.log("Chain ID:          ", block.chainid);
        console2.log("ReputationModule:  ", address(reputation));
        console2.log("CircleImpl:        ", address(circleImpl));
        console2.log("CircleFactory:     ", address(factory));
        console2.log("VRF Coordinator:   ", vrfCoord);
        console2.log("VRF Subscription:  ", vrfSubId);
        console2.log("========================================");
        console2.log("\nNext steps:");
        console2.log("1. Copy addresses to frontend/.env");
        if (vrfCoord != address(0)) {
            console2.log("2. Add CircleFactory as VRF consumer at https://vrf.chain.link");
            console2.log("3. Fund VRF subscription with LINK");
        }
        console2.log("4. Register circles at https://automation.chain.link");
        console2.log("========================================\n");
    }
}
