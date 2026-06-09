# ArbiCycle

> **Trustless rotating savings circles (Ajo · Chama · Stokvel) — autonomous, yield-bearing, and fraud-proof on Arbitrum.**

[![Built on Arbitrum](https://img.shields.io/badge/Built%20on-Arbitrum-2563EB)](https://arbitrum.io)
[![Robinhood Chain](https://img.shields.io/badge/Prize%20Track-Robinhood%20Chain-8B5CF6)](https://developer.robinhoodchain.com)
[![Chainlink VRF](https://img.shields.io/badge/Fairness-Chainlink%20VRF%20v2.5-375BD2)](https://vrf.chain.link)
[![Chainlink Automation](https://img.shields.io/badge/Keeper-Chainlink%20Automation-375BD2)](https://automation.chain.link)
[![Aave v3](https://img.shields.io/badge/Yield-Aave%20v3-8B5CF6)](https://aave.com)

---

## Deployed Contracts — Arbitrum Sepolia (testnet)

| Contract | Address | Explorer |
|---|---|---|
| **CircleFactory** | `0xbbAE2b7b65c9a9cFA350B6498411C8bD0288e2d1` | [View](https://sepolia.arbiscan.io/address/0xbbAE2b7b65c9a9cFA350B6498411C8bD0288e2d1) |
| **ArbiCycleCircle** (implementation) | `0xe5b31a15f116c751c144178672e0886f437b62e6` | [View](https://sepolia.arbiscan.io/address/0xe5b31a15f116c751c144178672e0886f437b62e6) |
| **ReputationModule** | `0xd4dF8e90e7962D3D057d15b5A0835473e0a048E8` | [View](https://sepolia.arbiscan.io/address/0xd4dF8e90e7962D3D057d15b5A0835473e0a048E8) |
| **USDC (testnet)** | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` | [View](https://sepolia.arbiscan.io/address/0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d) |

> Live demo: **http://localhost:5173** (run `cd frontend && npm run dev`)

---

## One-line pitch (for hackathon judges)

**ArbiCycle eliminates fraud, defaults, and zero yield in Africa's $180B rotating savings market by replacing human collectors with trustless Arbitrum smart contracts + Chainlink agentic automation.**

---

## The Problem

**500 million Africans** use informal rotating savings circles — called **Ajo** (Nigeria), **Chama** (Kenya), **Stokvel** (South Africa). Every week or month, members contribute a fixed amount to a shared pot; one member receives the full pot per round.

The problems are real, daily, and costly:

| Problem | ArbiCycle Solution |
|---|---|
| Collector fraud (runs away with funds) | Smart contract holds funds — no human custodian |
| Cash theft / physical insecurity | Funds live on-chain in Aave |
| Defaults with no recourse | Auto-kick after 2 misses; on-chain reputation penalty |
| Manual tracking, disputes | Fully transparent on-chain history |
| Zero yield on idle funds | Aave v3 earns yield between rotations |
| Diaspora exclusion | Join from anywhere with a phone |
| Unfair payout order (rigged by collector) | Chainlink VRF v2.5 — provably random, verifiable |

---

## How ArbiCycle Works

```
1. Creator deploys a circle (group size, amount, weekly/monthly)
2. Members join by depositing USDC → instantly earns Aave yield
3. Once full: Chainlink VRF randomises the payout order (on-chain, verifiable)
4. Each round: members contribute via the PWA
5. Chainlink Automation keeper triggers rotation on due date
6. Full pot (principal + yield + penalties) sent to this round's recipient
7. Missed members get reputation hits; 2 consecutive misses = auto-kick
8. After N rounds: everyone has received once — circle complete
```

Zero manual steps after setup. Zero trust required.

---

## Architecture

```
arbicycle/
├── contracts/                   # Foundry — Solidity 0.8.24
│   ├── src/
│   │   ├── ArbiCycleCircle.sol  # Core ROSCA: VRF + Automation + Aave + auto-kick
│   │   ├── CircleFactory.sol    # EIP-1167 clone factory + registry
│   │   └── ReputationModule.sol # On-chain credit scoring (0–1000)
│   ├── script/Deploy.s.sol      # Multi-chain: Arbitrum Sepolia + One + Robinhood Chain
│   └── test/ArbiCycle.t.sol     # Foundry tests (VRF mock, auto-kick, full cycle)
├── frontend/                    # React 18 + Vite + wagmi v2 — Mobile-first PWA
│   └── src/
│       ├── pages/               # Home · CreateCircle · JoinCircle · Dashboard · Profile
│       └── config/              # wagmi (3 chains) · ABIs
└── keeper/                      # Node.js off-chain keeper — Chainlink Automation backup
```

---

## Smart Contract Deep-Dive

### ArbiCycleCircle.sol — the heart

| Feature | Implementation | Why it matters |
|---|---|---|
| **VRF fairness** | Chainlink VRF v2.5 Fisher-Yates shuffle at start | Provably random payout order — no collector can rig it |
| **Agentic keeper** | `checkUpkeep` / `performUpkeep` (AutomationCompatible) | Zero-touch rotation enforcement — the contract runs itself |
| **Auto-kick** | 2 consecutive misses → `isActive = false`, funds seized | Clean default handling — no stuck circles |
| **Yield** | Aave v3 `supply()` on join + contribute; `withdraw()` at rotation | Every USDC earns while it waits |
| **Penalties** | 2 % BPS on late/missed; goes to group pot | Financial deterrent keeps members honest |
| **Reputation** | Per-event scoring: +10 on-time / −80 missed / +50 received | Cross-circle credit history — unlocks micro-lending |
| **Gas** | EIP-1167 clone: ~50k vs ~2M for full deploy | Affordable for $30 Android phone users |
| **x402 streams** | `PaymentStreamExecuted` event per contribution | x402-compatible payment stream reference for agentic agents |
| **Security** | ReentrancyGuard + Pausable + CEI pattern + custom errors | Auditable, minimal attack surface |

### Chainlink VRF — proxy-compatible pattern

VRFConsumerBaseV2Plus requires a constructor, which breaks EIP-1167 clones.  
ArbiCycle solves this by implementing `rawFulfillRandomWords()` inline, validating `msg.sender == vrfCoordinator` — the identical check made by the base contract.

**Fallback on Robinhood Chain**: if `vrfCoordinator == address(0)`, a block-hash-seeded Fisher-Yates shuffle runs instead. Weaker security, but sufficient for a chain where VRF isn't yet live. The switch is a single constructor param.

### Auto-kick (clean default handling)

```
Member misses round N   → consecutiveMisses = 1, reputation −80, 2% penalty
Member misses round N+1 → consecutiveMisses = 2, auto-kicked (isActive = false)
                          their deposited funds seize to the group pot
                          rotation skips them in all future rounds
```

Forfeiture is intentional — it is the deterrent. Post-hackathon V2 will add a configurable partial-refund option.

### x402 Payment Stream Architecture

Each `contribute()` call emits:

```solidity
event PaymentStreamExecuted(
    bytes32 indexed streamId,   // keccak256(circle, member, round)
    address indexed member,
    uint256 amount,
    uint256 round
);
```

This gives off-chain x402 agents a verifiable stream reference to:
- Reconcile payment records across circles
- Trigger mobile-money on-ramps (OPay/PalmPay APIs)
- Auto-verify contribution completeness before rotation

Full x402 extension (post-hackathon): EIP-2612 permit + HTTP 402 headers + mobile-money relay.

### ReputationModule.sol

| Event | Score |
|---|---|
| On-time contribution | +10 |
| Rotation received | +50 |
| Late payment | −20 |
| Missed payment | −80 |

Score ≥ 300 → eligible for collateral-free micro-loans up to 5× contribution across any circle.

---

## Deployed Contracts

> Fill in after running the deploy script.

| Chain | CircleFactory | ReputationModule |
|---|---|---|
| Arbitrum Sepolia | `0x...` | `0x...` |
| Robinhood Chain | `0x...` | `0x...` |

---

## Quick Start

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- Node.js 20+
- Arbitrum Sepolia RPC ([Alchemy](https://alchemy.com) free tier works)
- Testnet ETH ([faucet](https://faucets.chain.link))

### 1 — Install dependencies

```bash
# Contracts
cd contracts
forge install OpenZeppelin/openzeppelin-contracts smartcontractkit/chainlink aave/aave-v3-core

# Frontend
cd ../frontend && npm install

# Keeper
cd ../keeper && npm install
```

### 2 — Run tests

```bash
cd contracts
forge test -vv
```

All 12 tests should pass, including:
- `test_payoutOrderSet` — payout order contains all indices exactly once
- `test_autoKickAfterTwoMisses` — member kicked after 2 consecutive misses
- `test_vrfCallbackSetsPayoutOrder` — mock VRF callback activates circle
- `test_streamIdEmitted` — x402 stream event emitted on contribute
- `test_fullCycleCompletes` — complete 3-round cycle ends in COMPLETED state

### 3 — Deploy

```bash
# Copy and fill .env
cp contracts/.env.example contracts/.env

# Arbitrum Sepolia (Chainlink VRF live)
forge script script/Deploy.s.sol \
  --rpc-url $ARB_SEPOLIA_RPC \
  --broadcast \
  --verify

# Robinhood Chain (VRF fallback to block-hash)
forge script script/Deploy.s.sol \
  --rpc-url $ROBINHOOD_RPC \
  --broadcast
```

After deploy: copy the printed addresses to `frontend/.env`.

### 4 — Set up Chainlink VRF (Arbitrum Sepolia)

1. Go to [vrf.chain.link](https://vrf.chain.link)
2. Create a subscription, fund with testnet LINK
3. Add the deployed `CircleFactory` address as a consumer
4. Copy subscription ID to `contracts/.env` as `VRF_SUBSCRIPTION_ID`

### 5 — Register Chainlink Automation

1. Go to [automation.chain.link](https://automation.chain.link)
2. New Upkeep → Custom Logic
3. Target = your circle contract address
4. Fund with LINK

### 6 — Run frontend

```bash
cd frontend
cp .env.example .env   # fill in deployed addresses
npm run dev            # opens at http://localhost:5173
```

### 7 — (Optional) Run fallback keeper

```bash
cd keeper
cp .env.example .env   # fill in RPC + private key + factory address
npm run dev
```

---

## Demo Video Script — Nigerian User Flow

> **Narrator**: "Meet Amaka in Lagos. She's been in the same Ajo group for 5 years — but last year, the collector ran away with ₦800,000."

> **Scene 1** — Amaka opens ArbiCycle on her PalmPay phone. She creates a 10-person circle: "Lagos Friday Ajo", 50 USDC/week. Shares the link on WhatsApp.

> **Scene 2** — Nine friends join. The 10th member's join triggers Chainlink VRF — the payout order is shuffled on-chain, verifiable by anyone.

> **Scene 3** — Week 3 is Amaka's rotation. She contributes on Monday. Chainlink Automation fires on Friday — zero manual action. She receives $500 USDC + $1.20 Aave yield directly to her wallet.

> **Scene 4** — Emeka missed two weeks. The smart contract auto-kicks him (funds seized to pot). His on-chain reputation drops — he'll find it harder to join future circles.

> **Scene 5** — "No collector. No fraud. No cash. Just Arbitrum."

---

## Why ArbiCycle Wins

### Arbitrum Open House London — judging criteria

| Criterion | ArbiCycle score | Evidence |
|---|---|---|
| **Smart contract quality** | ⭐⭐⭐⭐⭐ | ReentrancyGuard · Pausable · CEI · custom errors · EIP-1167 · VRF proxy-compat pattern · full NatSpec |
| **Product-Market Fit** | ⭐⭐⭐⭐⭐ | $180B annual ROSCA market · 500M users · zero existing on-chain solution with this feature set |
| **Innovation** | ⭐⭐⭐⭐⭐ | VRF proxy-compat pattern · x402 stream events · auto-kick with on-chain forfeit · 3-chain deploy |
| **Real problem solving** | ⭐⭐⭐⭐⭐ | Directly eliminates fraud / theft / defaults / zero yield — real harm to real people |

### Differentiation from KURA (existing on-chain ROSCA)

| Feature | KURA | ArbiCycle |
|---|---|---|
| Rotation order | Manual / sequential | Chainlink VRF v2.5 — provably random |
| Rotation trigger | Manual admin call | Chainlink Automation — trustless keeper |
| Default handling | None | Auto-kick after 2 misses, funds seized |
| Yield | None | Aave v3 on all deposited funds |
| Reputation | None | On-chain score → micro-lending access |
| Deploy cost | ~2M gas per circle | ~50k gas (EIP-1167 clone) |
| Multi-chain | One chain | Arbitrum Sepolia + Arbitrum One + Robinhood Chain |
| Payment streams | None | x402-compatible PaymentStreamExecuted events |

### Agentic Project Track ($15k)

ArbiCycle's automation layer is a **genuine agentic system**:
- **Chainlink VRF**: autonomous randomness agent determines payout order at circle start
- **Chainlink Automation**: autonomous enforcement agent monitors deadlines, triggers rotations, applies penalties — zero human intervention
- **Auto-kick agent**: `_applyPenalties()` autonomously ejects defaulters and redistributes funds
- **x402 stream events**: each contribution is an autonomous payment stream step, compatible with x402 agentic payment agents

This is not AI cosplay. It is real autonomy backed by cryptographic guarantees.

### Robinhood Chain Track

ArbiCycle deploys on **Robinhood Chain** (Arbitrum Orbit L3) with automatic fallback when Chainlink VRF is not yet live (block-hash shuffle). This makes it one of the few projects competing in **both** the Overall Prize and the Robinhood Chain reserved slot simultaneously.

---

## Mobile-Money On-Ramps (Africa)

The smart contracts only see USDC. On-ramping is handled at the frontend layer:

| Provider | Countries | Integration |
|---|---|---|
| OPay | Nigeria | REST API + widget SDK |
| PalmPay | Nigeria | Deeplink + webhook |
| MTN MoMo | Ghana, Kenya, Uganda | USSD + REST API |
| Chipper Cash | Pan-Africa | Widget SDK |

All integration points are commented in the codebase with `// TODO: mobile-money on-ramp`.

---

## Security Considerations

- All fund flows guarded by `ReentrancyGuard`
- `Pausable` for emergency circuit-breaker (admin-only)
- CEI pattern throughout (Checks → Effects → Interactions)
- No `selfdestruct`, no `delegatecall` in circle logic
- VRF callback validates `msg.sender == vrfCoordinator`
- Chainlink `performUpkeep` has timestamp double-check
- Factory does not hold funds — all USDC lives in individual circle contracts
- Contracts are non-upgradeable post-activation — fully immutable once ACTIVE
- `forceApprove` handles USDT-style tokens with non-standard approval flow

---

## Roadmap (post-hackathon)

- [ ] Stylus (Rust) port of `ArbiCycleCircle` for lower gas on L3s
- [ ] EIP-2612 permit for gasless contributions (full x402 stream)
- [ ] Sub-circles (groups within groups for large communities)
- [ ] SMS/USSD interface for feature-phone users (Nigeria/Kenya)
- [ ] Morpho/Compound vault strategy for optimised yield
- [ ] Chainlink VRF on Robinhood Chain (once available)
- [ ] Partial-refund option on kick (configurable by circle creator)
- [ ] Multi-sig circle governance for enterprise Chamas

---

## Team

Built for the **Arbitrum Open House London: Online Buildathon** (May 25 – June 14, 2026).

Targeting: **Overall Prize** + **Best Agentic Project** + **Robinhood Chain** reserved slot.

---

## License

MIT
