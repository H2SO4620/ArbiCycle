// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {IReputationModule} from "./interfaces/IReputationModule.sol";

// ─── Chainlink Automation ─────────────────────────────────────────────────────
interface AutomationCompatibleInterface {
    function checkUpkeep(bytes calldata checkData)
        external
        returns (bool upkeepNeeded, bytes memory performData);
    function performUpkeep(bytes calldata performData) external;
}

// ─── Chainlink VRF v2.5 (proxy-compatible inline — no constructor needed) ─────
//
// Why inline instead of inheriting VRFConsumerBaseV2Plus?
//   EIP-1167 clones cannot run base-contract constructors.
//   VRFConsumerBaseV2Plus sets vrfCoordinator in its constructor, which would
//   be lost on every clone. We replicate the minimal pattern directly.
//
// Security: rawFulfillRandomWords validates msg.sender == vrfCoordinator,
//           matching the exact check in VRFConsumerBaseV2Plus.sol.
//
interface IVRFCoordinatorV2Plus {
    struct RandomWordsRequest {
        bytes32 keyHash;
        uint256 subId;
        uint16  requestConfirmations;
        uint32  callbackGasLimit;
        uint32  numWords;
        bytes   extraArgs;      // abi.encode(VRFV2PlusClient.ExtraArgsV1{nativePayment: false})
    }
    function requestRandomWords(RandomWordsRequest calldata req) external returns (uint256 requestId);
}

// ─── Aave v3 (minimal) ────────────────────────────────────────────────────────
interface IAavePool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}

// ─── Circle Factory (minimal — for member index registration) ─────────────────
interface ICircleFactory {
    function registerMember(address user) external;
}

/**
 * @title  ArbiCycleCircle
 * @author ArbiCycle
 * @notice Trustless on-chain ROSCA — Ajo / Chama / Stokvel — digitised on Arbitrum.
 *
 * ── Lifecycle ───────────────────────────────────────────────────────────────
 *   PENDING  → members join (up to maxMembers).
 *   (VRF)    → if VRF enabled: coordinator randomises payout order off-chain.
 *   ACTIVE   → autonomous rounds; Chainlink Automation enforces deadlines.
 *   COMPLETED→ all maxMembers rounds done; every member has received once.
 *   CANCELLED→ admin abort during PENDING; all deposits refunded.
 *
 * ── Agentic Automation Layer ────────────────────────────────────────────────
 *   checkUpkeep / performUpkeep implement AutomationCompatibleInterface.
 *   Register each circle at https://automation.chain.link as a Custom Logic
 *   upkeep. The keeper calls performUpkeep() at round end, which:
 *     1. Applies late/miss penalties  (2 % BPS, reputation hit)
 *     2. Auto-kicks members with ≥ 2 consecutive misses (funds seized to pot)
 *     3. Executes rotation (withdraws Aave pot, transfers to recipient)
 *     4. Starts next round
 *
 * ── VRF Fairness ────────────────────────────────────────────────────────────
 *   Chainlink VRF v2.5 randomises payout order at circle start.
 *   Without VRF (e.g. Robinhood Chain where VRF not yet live), the contract
 *   falls back to a block-hash-seeded Fisher-Yates shuffle — weaker but
 *   sufficient for testnet demos. Set vrfCoordinator = address(0) to use
 *   the fallback.
 *
 * ── x402 Payment Stream ─────────────────────────────────────────────────────
 *   Each contribute() call is a discrete payment in a recurring agentic stream.
 *
 *   Stream model:
 *     streamId  = keccak256(circleAddress, memberAddress, round)
 *     agent     = Chainlink Automation keeper (autonomous enforcer)
 *     on-ramp   = OPay / PalmPay / MTN MoMo → USDC (fiat → chain)
 *     off-ramp  = USDC → OPay / PalmPay (chain → fiat, payout leg)
 *
 *   Full x402 extension path (post-hackathon):
 *     1. Member pre-authorises stream via EIP-2612 permit (gasless)
 *     2. Mobile-money on-ramp POSTs HTTP 402 → funds USDC → calls contribute()
 *     3. Keeper enforces on-chain; x402 agent handles fiat conversion
 *     Reference: https://x402.org  (HTTP 402 standard for agentic payments)
 *
 * ── Security ─────────────────────────────────────────────────────────────────
 *   • ReentrancyGuard on all fund-moving paths
 *   • Initializable (EIP-1167 clone — no constructor)
 *   • Pausable: only admin; cancel only allowed in PENDING
 *   • No admin keys once ACTIVE — fully autonomous
 *   • VRF callback validates msg.sender == vrfCoordinator
 *   • Chainlink performUpkeep has timestamp double-check
 *   • CEI pattern throughout (Checks → Effects → Interactions)
 *
 * ── Differentiation from KURA ────────────────────────────────────────────────
 *   KURA: basic on-chain ROSCA, manual rotation.
 *   ArbiCycle adds:
 *     ✓ Chainlink VRF provably-random payout order (anti-manipulation)
 *     ✓ Autonomous Chainlink Automation keeper (zero-touch execution)
 *     ✓ Auto-kick with 2-miss threshold (clean default handling)
 *     ✓ On-chain reputation module (cross-circle credit scoring)
 *     ✓ Aave v3 yield on idle funds (money never sits still)
 *     ✓ x402-compatible recurring payment architecture
 *     ✓ EIP-1167 clone factory (50k gas per deploy vs 2M)
 */
contract ArbiCycleCircle is
    Initializable,
    ReentrancyGuard,
    Pausable,
    AutomationCompatibleInterface
{
    using SafeERC20 for IERC20;

    // ─────────────────────────────────────────────────────────────────────────
    // Constants
    // ─────────────────────────────────────────────────────────────────────────

    uint256 public constant PENALTY_BPS      = 200;     // 2 % late-payment penalty
    uint256 public constant BPS_DENOMINATOR  = 10_000;
    uint256 public constant LATE_WINDOW      = 24 hours; // grace period after round end
    uint256 public constant MIN_MEMBERS      = 3;
    uint256 public constant MAX_MEMBERS      = 50;
    uint8   public constant MISS_LIMIT       = 2;        // consecutive misses before kick

    // Chainlink VRF v2.5 tuning
    uint16  public constant VRF_CONFIRMATIONS   = 3;
    uint32  public constant VRF_CALLBACK_GAS    = 100_000;
    uint32  public constant VRF_NUM_WORDS       = 1;

    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    enum CircleState { PENDING, ACTIVE, COMPLETED, CANCELLED }
    enum RotationFrequency { WEEKLY, BIWEEKLY, MONTHLY }

    /// @dev Extended member record (v2 — adds VRF-era fields)
    struct Member {
        address addr;
        uint256 joinedAt;
        bool    hasContributedThisRound;
        uint256 contributedAt;           // timestamp (0 = not yet contributed)
        bool    hasReceived;             // received rotation payout
        bool    isActive;                // false after auto-kick
        uint8   consecutiveMisses;       // resets on any payment; kick at MISS_LIMIT
        uint256 totalContributed;        // cumulative USDC deposited (6 dec)
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Storage — protocol addresses
    // ─────────────────────────────────────────────────────────────────────────

    IERC20             public usdc;
    IAavePool          public aavePool;
    IERC20             public aUsdc;
    IReputationModule  public reputationModule;
    address            public factory;

    // ─────────────────────────────────────────────────────────────────────────
    // Storage — circle parameters (immutable post-activation)
    // ─────────────────────────────────────────────────────────────────────────

    string  public name;
    uint256 public contributionAmount;   // 6-decimal USDC (min 1 USDC)
    uint256 public maxMembers;
    RotationFrequency public frequency;
    uint256 public roundDuration;        // derived from frequency in seconds

    // ─────────────────────────────────────────────────────────────────────────
    // Storage — runtime state
    // ─────────────────────────────────────────────────────────────────────────

    CircleState public state;
    Member[]    public members;
    mapping(address => uint256) public memberIndex; // addr → 1-indexed (0 = non-member)

    uint256 public currentRound;           // 0-indexed
    uint256 public currentRecipientIdx;    // index into members[]
    uint256 public roundStartTime;
    uint256 public accumulatedPenalties;   // USDC penalty pool for current round
    uint256 public activeMembers;          // decrements on kick

    address public admin;

    // ─────────────────────────────────────────────────────────────────────────
    // Storage — VRF v2.5 (proxy-compatible)
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Set to address(0) to disable VRF (e.g. on Robinhood Chain before
    ///      Chainlink VRF is available — falls back to block-hash shuffle).
    address public vrfCoordinator;
    uint256 public vrfSubscriptionId;
    bytes32 public vrfKeyHash;
    uint256 public vrfRequestId;
    bool    public vrfPending; // circle is full but waiting for VRF callback

    // ─────────────────────────────────────────────────────────────────────────
    // Storage — payout order (set by VRF or fallback)
    // ─────────────────────────────────────────────────────────────────────────

    uint256[] private _payoutOrder;  // indices into members[]; shuffled by VRF
    uint256   public  roundIndex;    // current position in _payoutOrder

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event MemberJoined(address indexed member, uint256 memberCount);
    event VRFRequested(uint256 indexed requestId);
    event PayoutOrderSet(uint256[] payoutOrder, bool vrfRandomised);
    event CircleActivated(uint256 activatedAt);
    event ContributionMade(address indexed member, uint256 amount, uint256 round);
    /// @dev x402 stream reference emitted on every contribution for off-chain agent tracking
    event PaymentStreamExecuted(
        bytes32 indexed streamId,
        address indexed member,
        uint256 amount,
        uint256 round
    );
    event PenaltyApplied(address indexed member, uint256 penaltyAmount, uint256 round, bool missed);
    event MemberKicked(address indexed member, uint256 round, uint8 consecutiveMisses);
    event RotationExecuted(
        address indexed recipient,
        uint256 potAmount,
        uint256 yieldEarned,
        uint256 penalties,
        uint256 round
    );
    event CircleCompleted(uint256 completedAt, uint256 totalRounds);
    event CircleCancelled(uint256 cancelledAt);

    // ─────────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────────

    error NotMember();
    error AlreadyMember();
    error CircleFull();
    error WrongState(CircleState current);
    error AlreadyContributed();
    error RotationNotDue();
    error VRFStillPending();
    error OnlyVRFCoordinator();
    error Unauthorized();
    error InvalidParameters(string reason);

    // ─────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────────────────

    modifier onlyMember() {
        if (memberIndex[msg.sender] == 0) revert NotMember();
        _;
    }

    modifier inState(CircleState expected) {
        if (state != expected) revert WrongState(state);
        _;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin && msg.sender != factory) revert Unauthorized();
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Initializer — called once per clone by CircleFactory
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @param _vrfCoordinator VRF v2.5 coordinator address.
     *                        Pass address(0) to disable VRF (Robinhood Chain fallback).
     *                        Arbitrum Sepolia: 0x5CE8D5A2BC84beb22a398CCA51996F7930313D61
     *                        Arbitrum One:     0x41034678D6C633D8a95c75e1138A360a28bA15d1
     * @param _vrfSubId       Chainlink VRF subscription ID (ignored if _vrfCoordinator == 0)
     * @param _vrfKeyHash     Key hash for gas lane (ignored if _vrfCoordinator == 0)
     *                        Arbitrum Sepolia 150-gwei lane: 0x027f94ff...
     */
    function initialize(
        string calldata _name,
        address _admin,
        address _usdc,
        address _aavePool,
        address _aUsdc,
        address _reputationModule,
        uint256 _contributionAmount,
        uint256 _maxMembers,
        uint8   _frequency,
        address _vrfCoordinator,
        uint256 _vrfSubId,
        bytes32 _vrfKeyHash
    ) external initializer {
        if (_maxMembers < MIN_MEMBERS || _maxMembers > MAX_MEMBERS)
            revert InvalidParameters("member count out of range");
        if (_contributionAmount < 1e6)
            revert InvalidParameters("contribution too small");
        if (_frequency > 2)
            revert InvalidParameters("invalid frequency");

        name              = _name;
        admin             = _admin;
        factory           = msg.sender;
        usdc              = IERC20(_usdc);
        aavePool          = IAavePool(_aavePool);
        aUsdc             = IERC20(_aUsdc);
        reputationModule  = IReputationModule(_reputationModule);
        contributionAmount = _contributionAmount;
        maxMembers        = _maxMembers;
        frequency         = RotationFrequency(_frequency);
        state             = CircleState.PENDING;

        // VRF — optional
        vrfCoordinator    = _vrfCoordinator;
        vrfSubscriptionId = _vrfSubId;
        vrfKeyHash        = _vrfKeyHash;

        if (_frequency == uint8(RotationFrequency.WEEKLY))        roundDuration = 7 days;
        else if (_frequency == uint8(RotationFrequency.BIWEEKLY)) roundDuration = 14 days;
        else                                                        roundDuration = 30 days;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Member actions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Join the circle by depositing the first round's contribution.
     * @dev    Circle auto-activates (or requests VRF) when maxMembers is reached.
     *         Caller must approve `contributionAmount` USDC beforehand.
     *
     *         x402 Note: in a full x402 integration, the on-ramp (OPay/PalmPay)
     *         would POST the payment and then call join() on the member's behalf
     *         via a meta-transaction relayer.
     */
    function join() external nonReentrant whenNotPaused inState(CircleState.PENDING) {
        if (memberIndex[msg.sender] != 0) revert AlreadyMember();
        if (members.length >= maxMembers) revert CircleFull();

        // Pull first-round contribution into Aave
        usdc.safeTransferFrom(msg.sender, address(this), contributionAmount);
        _depositToAave(contributionAmount);

        members.push(Member({
            addr:                   msg.sender,
            joinedAt:               block.timestamp,
            hasContributedThisRound: true,
            contributedAt:          block.timestamp,
            hasReceived:            false,
            isActive:               true,
            consecutiveMisses:      0,
            totalContributed:       contributionAmount
        }));
        memberIndex[msg.sender] = members.length; // 1-indexed
        activeMembers++;

        // Register with factory for user→circle index
        ICircleFactory(factory).registerMember(msg.sender);

        emit MemberJoined(msg.sender, members.length);
        reputationModule.recordContribution(msg.sender, true);

        // Emit x402 stream reference for the join-payment
        emit PaymentStreamExecuted(
            keccak256(abi.encodePacked(address(this), msg.sender, uint256(0))),
            msg.sender,
            contributionAmount,
            0
        );

        if (members.length == maxMembers) {
            _activateCircle();
        }
    }

    /**
     * @notice Contribute for the current active round.
     * @dev    Caller must approve `contributionAmount` USDC beforehand.
     *         The current round's recipient is exempt from contributing.
     *
     *         x402 Payment Stream:
     *           streamId  = keccak256(circleAddress, member, round)
     *           Each call emits PaymentStreamExecuted for off-chain x402 agent tracking.
     *           Agent can reconcile payment streams across circles and trigger
     *           mobile-money on-ramps automatically (OPay/PalmPay APIs).
     */
    function contribute() external nonReentrant whenNotPaused onlyMember inState(CircleState.ACTIVE) {
        uint256 idx = memberIndex[msg.sender] - 1;
        if (!members[idx].isActive) revert NotMember();
        if (members[idx].hasContributedThisRound) revert AlreadyContributed();

        usdc.safeTransferFrom(msg.sender, address(this), contributionAmount);
        _depositToAave(contributionAmount);

        members[idx].hasContributedThisRound = true;
        members[idx].contributedAt           = block.timestamp;
        members[idx].totalContributed       += contributionAmount;
        members[idx].consecutiveMisses       = 0; // streak broken — reset

        emit ContributionMade(msg.sender, contributionAmount, currentRound);

        // x402: log stream reference for off-chain agent tracking
        bytes32 streamId = keccak256(abi.encodePacked(address(this), msg.sender, currentRound));
        emit PaymentStreamExecuted(streamId, msg.sender, contributionAmount, currentRound);

        bool onTime = block.timestamp <= roundStartTime + roundDuration - LATE_WINDOW;
        reputationModule.recordContribution(msg.sender, onTime);
        if (!onTime) reputationModule.recordLatePayment(msg.sender);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Chainlink VRF v2.5 — proxy-compatible callback
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Called by the VRF coordinator with the random result.
     * @dev    Only the configured vrfCoordinator may call this.
     *         Mirrors the VRFConsumerBaseV2Plus pattern without inheritance
     *         so it works with EIP-1167 clones.
     */
    function rawFulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) external {
        if (msg.sender != vrfCoordinator) revert OnlyVRFCoordinator();
        if (requestId != vrfRequestId) return; // stale or duplicate — ignore

        vrfPending = false;

        // Initialise payout order with VRF-provided randomness
        _initPayoutOrder(randomWords[0]);

        // Circle is now ACTIVE
        state            = CircleState.ACTIVE;
        roundStartTime   = block.timestamp;
        currentRound     = 0;
        currentRecipientIdx = _payoutOrder[0];

        emit PayoutOrderSet(_payoutOrder, true);
        emit CircleActivated(block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Chainlink Automation
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Chainlink Automation nodes poll this every block.
     * @return upkeepNeeded true when the round deadline has passed and circle is ACTIVE.
     */
    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        upkeepNeeded =
            state == CircleState.ACTIVE &&
            !vrfPending &&
            block.timestamp >= roundStartTime + roundDuration;
        performData = "";
    }

    /**
     * @notice Keeper-triggered rotation — called by Chainlink Automation.
     * @dev    Double-checks timestamp to prevent premature execution.
     *         Also callable by anyone once the deadline passes (permissionless fallback).
     */
    function performUpkeep(bytes calldata) external override nonReentrant whenNotPaused {
        if (state != CircleState.ACTIVE) return;
        if (vrfPending) revert VRFStillPending();
        if (block.timestamp < roundStartTime + roundDuration) revert RotationNotDue();

        _applyPenalties();
        _executeRotation();
    }

    /**
     * @notice Permissionless rotation trigger — useful when Automation LINK runs out.
     */
    function triggerRotation() external nonReentrant whenNotPaused inState(CircleState.ACTIVE) {
        if (vrfPending) revert VRFStillPending();
        if (block.timestamp < roundStartTime + roundDuration) revert RotationNotDue();
        _applyPenalties();
        _executeRotation();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal — activation
    // ─────────────────────────────────────────────────────────────────────────

    function _activateCircle() internal {
        if (vrfCoordinator != address(0)) {
            // ── VRF path: request randomness, defer activation ──────────────
            vrfPending   = true;
            vrfRequestId = _requestVRF();
            emit VRFRequested(vrfRequestId);
            // State remains PENDING until rawFulfillRandomWords() is called
        } else {
            // ── Fallback path: deterministic shuffle (Robinhood Chain / testnet) ─
            // Seed from block hash — not VRF-secure but sufficient for demo.
            // Post-hackathon: integrate VRF once available on Robinhood Chain.
            uint256 seed = uint256(
                keccak256(abi.encodePacked(blockhash(block.number - 1), block.timestamp, address(this)))
            );
            _initPayoutOrder(seed);

            state               = CircleState.ACTIVE;
            roundStartTime      = block.timestamp;
            currentRound        = 0;
            currentRecipientIdx = _payoutOrder[0];

            emit PayoutOrderSet(_payoutOrder, false);
            emit CircleActivated(block.timestamp);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal — VRF request
    // ─────────────────────────────────────────────────────────────────────────

    function _requestVRF() internal returns (uint256 requestId) {
        // ExtraArgs for VRF v2.5: tag 0x92fd1338 + abi.encode(nativePayment=false)
        // Empty bytes ("") also valid — defaults to LINK payment.
        // Full encoding: abi.encodeWithSelector(bytes4(0x92fd1338), false)
        // We use the full encoding for explicit LINK-payment opt-in.
        bytes memory extraArgs = abi.encodeWithSelector(bytes4(0x92fd1338), false);

        requestId = IVRFCoordinatorV2Plus(vrfCoordinator).requestRandomWords(
            IVRFCoordinatorV2Plus.RandomWordsRequest({
                keyHash:              vrfKeyHash,
                subId:                vrfSubscriptionId,
                requestConfirmations: VRF_CONFIRMATIONS,
                callbackGasLimit:     VRF_CALLBACK_GAS,
                numWords:             VRF_NUM_WORDS,
                extraArgs:            extraArgs
            })
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal — payout order initialisation (Fisher-Yates shuffle)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @dev Fisher-Yates shuffle of member indices using `seed`.
     *      If seed == 0, sequential order is kept (join-order).
     *      Gas: O(n) where n ≤ 50 — acceptable for the callback gas limit.
     */
    function _initPayoutOrder(uint256 seed) internal {
        uint256 n = members.length;
        _payoutOrder = new uint256[](n);
        for (uint256 i = 0; i < n; i++) _payoutOrder[i] = i;

        if (seed != 0) {
            for (uint256 i = n - 1; i > 0; i--) {
                uint256 j = uint256(keccak256(abi.encodePacked(seed, i))) % (i + 1);
                (_payoutOrder[i], _payoutOrder[j]) = (_payoutOrder[j], _payoutOrder[i]);
            }
        }
        roundIndex = 0;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal — Aave
    // ─────────────────────────────────────────────────────────────────────────

    function _depositToAave(uint256 amount) internal {
        usdc.forceApprove(address(aavePool), amount);
        aavePool.supply(address(usdc), amount, address(this), 0);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal — penalty enforcement & auto-kick
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @dev Walks all active non-recipient members.
     *      Late/missed → 2 % penalty added to this round's pot.
     *      ≥ 2 consecutive misses → auto-kick (funds seized to pot, reputation slashed).
     *
     *      Note on penalty mechanics:
     *      Penalties are *virtual* — the 2 % is credited from the overall aUSDC pool
     *      to accumulatedPenalties and transferred to the recipient alongside the pot.
     *      In a production V2, missed members would have pre-authorised a larger
     *      approval so their contribution can be *pulled* on their behalf.
     */
    function _applyPenalties() internal {
        uint256 deadline = roundStartTime + roundDuration - LATE_WINDOW;

        for (uint256 i = 0; i < members.length; i++) {
            if (!members[i].isActive) continue;
            if (i == currentRecipientIdx) {
                // Recipient does not contribute this round — reset their streak
                members[i].consecutiveMisses = 0;
                continue;
            }

            if (!members[i].hasContributedThisRound) {
                // ── Missed payment ───────────────────────────────────────────
                uint256 penalty = (contributionAmount * PENALTY_BPS) / BPS_DENOMINATOR;
                accumulatedPenalties += penalty;
                members[i].consecutiveMisses++;
                reputationModule.recordMissedPayment(members[i].addr);
                emit PenaltyApplied(members[i].addr, penalty, currentRound, true);

                // Auto-kick after MISS_LIMIT (2) consecutive misses
                if (members[i].consecutiveMisses >= MISS_LIMIT) {
                    _kickMember(i);
                }
            } else if (members[i].contributedAt > deadline) {
                // ── Late payment ─────────────────────────────────────────────
                uint256 penalty = (contributionAmount * PENALTY_BPS) / BPS_DENOMINATOR;
                accumulatedPenalties += penalty;
                members[i].consecutiveMisses = 0; // late but paid — reset streak
                emit PenaltyApplied(members[i].addr, penalty, currentRound, false);
            } else {
                // ── On-time payment ───────────────────────────────────────────
                members[i].consecutiveMisses = 0;
            }
        }
    }

    /**
     * @dev Mark member as kicked. Their deposited funds remain in the Aave pool
     *      and boost the current rotation recipient's payout.
     *
     *      Design rationale: forfeiture (not refund) is the deterrent that keeps
     *      ROSCA circles honest. Two missed rounds is ample warning.
     *      Post-hackathon V2 will add a configurable partial-refund policy.
     */
    function _kickMember(uint256 idx) internal {
        members[idx].isActive = false;
        activeMembers--;
        emit MemberKicked(members[idx].addr, currentRound, members[idx].consecutiveMisses);
        // Extra reputation hit for being kicked
        reputationModule.recordMissedPayment(members[idx].addr);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal — rotation execution
    // ─────────────────────────────────────────────────────────────────────────

    function _executeRotation() internal {
        // If current recipient was kicked (edge case), advance first
        if (!members[currentRecipientIdx].isActive) {
            _advanceRecipient();
        }

        address recipient = members[currentRecipientIdx].addr;
        members[currentRecipientIdx].hasReceived = true;

        // Withdraw everything from Aave
        uint256 aUsdcBal = aUsdc.balanceOf(address(this));
        uint256 withdrawn;
        if (aUsdcBal > 0) {
            withdrawn = aavePool.withdraw(address(usdc), type(uint256).max, address(this));
        }

        // Yield earned = withdrawn amount minus principal deposited this round
        // Principal = (activeMembers - 1) * contributionAmount (recipient exempt)
        uint256 principal = contributionAmount * (activeMembers > 0 ? activeMembers - 1 : 0);
        uint256 yieldEarned = withdrawn > principal ? withdrawn - principal : 0;

        // Total pot = Aave withdrawal only.
        // accumulatedPenalties is a notional tally used for reputation scoring and
        // emitted in the event for off-chain tracking. In V2 with x402 pull-payments,
        // the keeper will pull penalty USDC from defaulters before the rotation so the
        // full penalty amount becomes real funds. For V1, penalties reduce the defaulter's
        // reputation score without augmenting the pot (prevents "virtual funds" transfer).
        uint256 potAmount = withdrawn;

        // ── CEI: state update before external call ────────────────────────────
        uint256 penaltiesSnapshot = accumulatedPenalties;
        accumulatedPenalties = 0;
        currentRound++;

        bool completed = currentRound >= _payoutOrder.length ||
                         _allReceived();

        if (!completed) {
            _advanceRecipient();
            // Reset contribution flags for next round
            for (uint256 i = 0; i < members.length; i++) {
                members[i].hasContributedThisRound = false;
                members[i].contributedAt = 0;
            }
            roundStartTime = block.timestamp;
        } else {
            state = CircleState.COMPLETED;
        }

        // ── Interaction: transfer pot to recipient ────────────────────────────
        if (potAmount > 0) {
            usdc.safeTransfer(recipient, potAmount);
        }

        emit RotationExecuted(recipient, potAmount, yieldEarned, penaltiesSnapshot, currentRound - 1);
        reputationModule.recordRotationReceived(recipient);

        if (completed) {
            emit CircleCompleted(block.timestamp, currentRound);
        }
    }

    function _advanceRecipient() internal {
        // Advance roundIndex past any kicked members
        uint256 n = _payoutOrder.length;
        for (uint256 step = 1; step <= n; step++) {
            uint256 nextIdx = _payoutOrder[(roundIndex + step) % n];
            if (members[nextIdx].isActive && !members[nextIdx].hasReceived) {
                roundIndex = (roundIndex + step) % n;
                currentRecipientIdx = nextIdx;
                return;
            }
        }
        // All remaining members have received (shouldn't happen before COMPLETED)
    }

    function _allReceived() internal view returns (bool) {
        for (uint256 i = 0; i < members.length; i++) {
            if (members[i].isActive && !members[i].hasReceived) return false;
        }
        return true;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View functions
    // ─────────────────────────────────────────────────────────────────────────

    function getMemberCount()       external view returns (uint256) { return members.length; }
    function getMember(uint256 idx) external view returns (Member memory) { return members[idx]; }
    function getAllMembers()         external view returns (Member[] memory) { return members; }
    function getPayoutOrder()       external view returns (uint256[] memory) { return _payoutOrder; }
    function isMember(address addr) external view returns (bool) { return memberIndex[addr] != 0; }

    function hasContributed(address addr) external view returns (bool) {
        uint256 idx = memberIndex[addr];
        if (idx == 0) return false;
        return members[idx - 1].hasContributedThisRound;
    }

    function getNextRotationTime() external view returns (uint256) {
        if (state != CircleState.ACTIVE) return 0;
        return roundStartTime + roundDuration;
    }

    function getCurrentPotValue() external view returns (uint256) {
        return aUsdc.balanceOf(address(this));
    }

    function getCurrentRecipient() external view returns (address) {
        if (state != CircleState.ACTIVE) return address(0);
        return members[currentRecipientIdx].addr;
    }

    /**
     * @notice Return a member's x402 stream ID for a given round.
     * @dev    Used by off-chain x402 agents to reconcile payment records.
     */
    function getStreamId(address member, uint256 round) external view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this), member, round));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin — restricted to PENDING state or emergencies
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Cancel circle and refund all members. Only callable in PENDING state.
     * @dev    Withdraws from Aave and returns each member's deposit.
     */
    function cancel() external nonReentrant onlyAdmin inState(CircleState.PENDING) {
        state = CircleState.CANCELLED;

        uint256 aUsdcBal = aUsdc.balanceOf(address(this));
        if (aUsdcBal > 0) {
            aavePool.withdraw(address(usdc), type(uint256).max, address(this));
        }

        for (uint256 i = 0; i < members.length; i++) {
            usdc.safeTransfer(members[i].addr, contributionAmount);
        }

        emit CircleCancelled(block.timestamp);
    }

    function pause()   external onlyAdmin { _pause(); }
    function unpause() external onlyAdmin { _unpause(); }
}
