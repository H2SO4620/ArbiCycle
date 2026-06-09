// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test, console2} from "forge-std/Test.sol";
import {ArbiCycleCircle} from "../src/ArbiCycleCircle.sol";
import {CircleFactory}   from "../src/CircleFactory.sol";
import {ReputationModule} from "../src/ReputationModule.sol";

// ─────────────────────────────────────────────────────────────────────────────
// Minimal mocks
// ─────────────────────────────────────────────────────────────────────────────

contract MockUSDC {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    // SafeERC20.forceApprove internally calls approve()
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient balance");
        require(allowance[from][msg.sender] >= amount, "insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract MockAUsdc {
    mapping(address => uint256) public balanceOf;
    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }
    function burn(address from, uint256 amount) external { balanceOf[from] -= amount; }
    function approve(address, uint256) external returns (bool) { return true; }
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount);
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract MockAavePool {
    MockUSDC  usdc;
    MockAUsdc aUsdc;

    constructor(address _usdc, address _aUsdc) {
        usdc  = MockUSDC(_usdc);
        aUsdc = MockAUsdc(_aUsdc);
    }

    function supply(address, uint256 amount, address onBehalfOf, uint16) external {
        usdc.transferFrom(msg.sender, address(this), amount);
        aUsdc.mint(onBehalfOf, amount);
    }

    function withdraw(address, uint256, address to) external returns (uint256) {
        uint256 amount = aUsdc.balanceOf(msg.sender);
        aUsdc.burn(msg.sender, amount);
        usdc.transfer(to, amount);
        return amount;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test suite
// ─────────────────────────────────────────────────────────────────────────────

contract ArbiCycleTest is Test {
    MockUSDC  usdc;
    MockAUsdc aUsdc;
    MockAavePool aavePool;
    ReputationModule reputation;
    ArbiCycleCircle  circleImpl;
    CircleFactory    factory;

    address alice   = makeAddr("alice");
    address bob     = makeAddr("bob");
    address charlie = makeAddr("charlie");
    address diana   = makeAddr("diana");
    address deployer = makeAddr("deployer");

    uint256 constant CONTRIBUTION = 100e6; // 100 USDC

    function setUp() public {
        vm.startPrank(deployer);

        usdc     = new MockUSDC();
        aUsdc    = new MockAUsdc();
        aavePool = new MockAavePool(address(usdc), address(aUsdc));

        // Seed pool so Aave withdraw always works
        usdc.mint(address(aavePool), 10_000_000e6);

        reputation = new ReputationModule(deployer);
        circleImpl = new ArbiCycleCircle();

        // VRF disabled (address(0)) for deterministic, fast tests
        factory = new CircleFactory(
            address(circleImpl),
            address(reputation),
            address(usdc),
            address(aavePool),
            address(aUsdc),
            deployer,
            address(0), // vrfCoordinator — disabled, uses block-hash shuffle
            0,
            bytes32(0)
        );

        reputation.transferOwnership(address(factory));
        vm.stopPrank();

        usdc.mint(alice,   100_000e6);
        usdc.mint(bob,     100_000e6);
        usdc.mint(charlie, 100_000e6);
        usdc.mint(diana,   100_000e6);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    function _createCircle3() internal returns (ArbiCycleCircle circle) {
        vm.prank(alice);
        address addr = factory.createCircle("Test Ajo", CONTRIBUTION, 3, 0);
        circle = ArbiCycleCircle(addr);
    }

    function _approveAndJoin(address user, ArbiCycleCircle circle) internal {
        vm.startPrank(user);
        usdc.approve(address(circle), type(uint256).max);
        circle.join();
        vm.stopPrank();
    }

    /**
     * @dev Complete a round for a 3-member circle.
     *      Round 0: join deposits ARE the contributions — just warp and rotate.
     *      Round 1+: non-recipients must explicitly call contribute().
     */
    function _completeRound(
        ArbiCycleCircle circle,
        address[3] memory mbrs,
        bool joinRound   // true = round 0 (no contribute needed), false = rounds 1+
    ) internal {
        if (!joinRound) {
            address recipient = circle.getCurrentRecipient();
            for (uint256 i = 0; i < 3; i++) {
                if (mbrs[i] == recipient) continue;
                uint256 idx = circle.memberIndex(mbrs[i]);
                if (idx == 0) continue;
                ArbiCycleCircle.Member memory m = circle.getMember(idx - 1);
                if (!m.isActive || m.hasContributedThisRound) continue;
                vm.prank(mbrs[i]);
                circle.contribute();
            }
        }
        vm.warp(block.timestamp + 7 days + 1);
        circle.triggerRotation();
    }

    // ── Core tests ────────────────────────────────────────────────────────────

    function test_createCircle() public {
        ArbiCycleCircle circle = _createCircle3();
        assertEq(circle.maxMembers(), 3);
        assertEq(circle.contributionAmount(), CONTRIBUTION);
        assertEq(uint8(circle.state()), uint8(ArbiCycleCircle.CircleState.PENDING));
    }

    function test_joinActivatesAtMaxMembers() public {
        ArbiCycleCircle circle = _createCircle3();

        _approveAndJoin(alice,   circle);
        assertEq(uint8(circle.state()), uint8(ArbiCycleCircle.CircleState.PENDING));

        _approveAndJoin(bob,     circle);
        assertEq(uint8(circle.state()), uint8(ArbiCycleCircle.CircleState.PENDING));

        _approveAndJoin(charlie, circle);
        // VRF disabled → ACTIVE immediately on last join
        assertEq(uint8(circle.state()), uint8(ArbiCycleCircle.CircleState.ACTIVE));
        assertEq(circle.getMemberCount(), 3);
        assertFalse(circle.vrfPending());
    }

    function test_payoutOrderSet() public {
        ArbiCycleCircle circle = _createCircle3();
        _approveAndJoin(alice, circle);
        _approveAndJoin(bob, circle);
        _approveAndJoin(charlie, circle);

        uint256[] memory order = circle.getPayoutOrder();
        assertEq(order.length, 3);

        // All 3 indices appear exactly once (valid permutation)
        bool[3] memory seen;
        for (uint256 i = 0; i < 3; i++) {
            assertFalse(seen[order[i]], "Duplicate in payout order");
            seen[order[i]] = true;
        }
    }

    /**
     * @dev Join deposits count as round 0 contributions.
     *      To test contribute(), we first complete round 0, then test in round 1.
     */
    function test_contribute() public {
        ArbiCycleCircle circle = _createCircle3();
        _approveAndJoin(alice, circle);
        _approveAndJoin(bob, circle);
        _approveAndJoin(charlie, circle);

        address[3] memory mbrs = [alice, bob, charlie];

        // Complete round 0 (join = contribution, no explicit contribute needed)
        _completeRound(circle, mbrs, true);
        assertEq(circle.currentRound(), 1);

        // Now in round 1 — non-recipients must call contribute()
        address recipient1 = circle.getCurrentRecipient();
        for (uint256 i = 0; i < 3; i++) {
            if (mbrs[i] == recipient1) continue;
            uint256 idx = circle.memberIndex(mbrs[i]);
            ArbiCycleCircle.Member memory m = circle.getMember(idx - 1);
            if (!m.isActive) continue;
            assertFalse(m.hasContributedThisRound, "Should not have contributed yet in round 1");
            vm.prank(mbrs[i]);
            circle.contribute();
            assertTrue(circle.hasContributed(mbrs[i]));
        }
    }

    function test_cannotContributeTwice() public {
        ArbiCycleCircle circle = _createCircle3();
        _approveAndJoin(alice, circle);
        _approveAndJoin(bob, circle);
        _approveAndJoin(charlie, circle);

        address[3] memory mbrs = [alice, bob, charlie];

        // Complete round 0 first
        _completeRound(circle, mbrs, true);

        // In round 1: pick a non-recipient and try to contribute twice
        address recipient1 = circle.getCurrentRecipient();
        address payer = address(0);
        for (uint256 i = 0; i < 3; i++) {
            if (mbrs[i] != recipient1) { payer = mbrs[i]; break; }
        }

        vm.startPrank(payer);
        circle.contribute();
        vm.expectRevert(ArbiCycleCircle.AlreadyContributed.selector);
        circle.contribute();
        vm.stopPrank();
    }

    function test_rotationPaysRecipient() public {
        ArbiCycleCircle circle = _createCircle3();
        _approveAndJoin(alice, circle);
        _approveAndJoin(bob, circle);
        _approveAndJoin(charlie, circle);

        // Round 0: join deposits = contributions; just warp and rotate
        address recipient0 = circle.getCurrentRecipient();
        uint256 balBefore  = usdc.balanceOf(recipient0);

        vm.warp(block.timestamp + 7 days + 1);
        circle.triggerRotation();

        uint256 balAfter = usdc.balanceOf(recipient0);
        // Pot = 3 × CONTRIBUTION from joins. Recipient paid CONTRIBUTION at join.
        // Net gain = 2 × CONTRIBUTION
        assertGe(balAfter - balBefore, 200e6);
        assertEq(circle.currentRound(), 1);
    }

    function test_fullCycleCompletes() public {
        ArbiCycleCircle circle = _createCircle3();
        _approveAndJoin(alice, circle);
        _approveAndJoin(bob, circle);
        _approveAndJoin(charlie, circle);

        address[3] memory mbrs = [alice, bob, charlie];

        // Round 0: join = contribution (no explicit contribute)
        _completeRound(circle, mbrs, true);
        // Rounds 1 and 2: explicit contributions required
        _completeRound(circle, mbrs, false);
        _completeRound(circle, mbrs, false);

        assertEq(uint8(circle.state()), uint8(ArbiCycleCircle.CircleState.COMPLETED));
    }

    function test_cannotRotateBeforeDeadline() public {
        ArbiCycleCircle circle = _createCircle3();
        _approveAndJoin(alice, circle);
        _approveAndJoin(bob, circle);
        _approveAndJoin(charlie, circle);

        vm.expectRevert(ArbiCycleCircle.RotationNotDue.selector);
        circle.triggerRotation();
    }

    function test_cancelRefundsMembers() public {
        ArbiCycleCircle circle = _createCircle3();
        _approveAndJoin(alice, circle);
        _approveAndJoin(bob, circle);

        uint256 aliceBefore = usdc.balanceOf(alice);
        uint256 bobBefore   = usdc.balanceOf(bob);

        vm.prank(alice);
        circle.cancel();

        assertEq(usdc.balanceOf(alice), aliceBefore + CONTRIBUTION);
        assertEq(usdc.balanceOf(bob),   bobBefore   + CONTRIBUTION);
        assertEq(uint8(circle.state()), uint8(ArbiCycleCircle.CircleState.CANCELLED));
    }

    function test_reputationScoreIncreases() public {
        ArbiCycleCircle circle = _createCircle3();
        _approveAndJoin(alice, circle);
        _approveAndJoin(bob, circle);
        _approveAndJoin(charlie, circle);

        address recipient0     = circle.getCurrentRecipient();
        uint256 scoreBefore    = reputation.getScore(recipient0);

        // Round 0: no contribute needed
        vm.warp(block.timestamp + 7 days + 1);
        circle.triggerRotation();

        uint256 scoreAfter = reputation.getScore(recipient0);
        assertGt(scoreAfter, scoreBefore);
    }

    function test_checkUpkeep() public {
        ArbiCycleCircle circle = _createCircle3();
        _approveAndJoin(alice, circle);
        _approveAndJoin(bob, circle);
        _approveAndJoin(charlie, circle);

        (bool needed,) = circle.checkUpkeep("");
        assertFalse(needed);

        vm.warp(block.timestamp + 7 days + 1);
        (needed,) = circle.checkUpkeep("");
        assertTrue(needed);
    }

    // ── Auto-kick tests ───────────────────────────────────────────────────────

    function test_penaltyAppliedForMissedPayment() public {
        ArbiCycleCircle circle = _createCircle3();
        _approveAndJoin(alice, circle);
        _approveAndJoin(bob, circle);
        _approveAndJoin(charlie, circle);

        address[3] memory mbrs = [alice, bob, charlie];

        // Complete round 0 (no contribute needed)
        _completeRound(circle, mbrs, true);

        // Round 1: pick a non-recipient to miss
        address recipient1 = circle.getCurrentRecipient();
        address payer  = address(0);
        address misser = address(0);
        for (uint256 i = 0; i < 3; i++) {
            if (mbrs[i] == recipient1) continue;
            if (payer == address(0)) { payer = mbrs[i]; }
            else { misser = mbrs[i]; }
        }

        // Only payer contributes; misser skips
        vm.prank(payer);
        circle.contribute();

        vm.warp(block.timestamp + 7 days + 1);
        circle.triggerRotation();

        // misser should have 1 consecutive miss, still active
        uint256 idx = circle.memberIndex(misser) - 1;
        ArbiCycleCircle.Member memory m = circle.getMember(idx);
        assertEq(m.consecutiveMisses, 1);
        assertTrue(m.isActive);
    }

    function test_autoKickAfterTwoMisses() public {
        // 4-member circle so circle can complete even after a kick
        vm.prank(alice);
        address addr = factory.createCircle("Kick Test", CONTRIBUTION, 4, 0);
        ArbiCycleCircle circle = ArbiCycleCircle(addr);

        _approveAndJoin(alice,   circle);
        _approveAndJoin(bob,     circle);
        _approveAndJoin(charlie, circle);
        _approveAndJoin(diana,   circle);

        address[4] memory mbrs4 = [alice, bob, charlie, diana];

        // Complete round 0 (join = contribution)
        vm.warp(block.timestamp + 7 days + 1);
        circle.triggerRotation();

        // Pick "victim" — a non-recipient in round 1 who will miss twice
        address recipient1 = circle.getCurrentRecipient();
        address victim = address(0);
        for (uint256 i = 0; i < 4; i++) {
            if (mbrs4[i] != recipient1) { victim = mbrs4[i]; break; }
        }

        // Round 1: everyone except recipient1 and victim contributes
        for (uint256 i = 0; i < 4; i++) {
            if (mbrs4[i] == recipient1 || mbrs4[i] == victim) continue;
            vm.prank(mbrs4[i]);
            circle.contribute();
        }
        vm.warp(block.timestamp + 7 days + 1);
        circle.triggerRotation(); // victim misses round 1 → consecutiveMisses = 1

        // Confirm 1 miss, still active
        uint256 vidx = circle.memberIndex(victim) - 1;
        assertEq(circle.getMember(vidx).consecutiveMisses, 1);
        assertTrue(circle.getMember(vidx).isActive);

        // Round 2: everyone except recipient2 and victim contributes
        address recipient2 = circle.getCurrentRecipient();
        for (uint256 i = 0; i < 4; i++) {
            if (mbrs4[i] == recipient2 || mbrs4[i] == victim) continue;
            uint256 midx = circle.memberIndex(mbrs4[i]);
            if (midx == 0) continue;
            ArbiCycleCircle.Member memory m = circle.getMember(midx - 1);
            if (!m.isActive || m.hasContributedThisRound) continue;
            vm.prank(mbrs4[i]);
            circle.contribute();
        }
        vm.warp(block.timestamp + 7 days + 1);
        circle.triggerRotation(); // victim misses round 2 → kicked

        // Confirm kicked
        assertFalse(circle.getMember(vidx).isActive, "Victim should be kicked after 2 misses");
    }

    function test_vrfCallbackSetsPayoutOrder() public {
        MockVRFCoordinator mockVRF = new MockVRFCoordinator();

        vm.startPrank(deployer);
        ReputationModule rep2 = new ReputationModule(deployer);
        CircleFactory vrfFactory = new CircleFactory(
            address(circleImpl),
            address(rep2),
            address(usdc),
            address(aavePool),
            address(aUsdc),
            deployer,
            address(mockVRF),
            1,
            bytes32(uint256(1))
        );
        rep2.transferOwnership(address(vrfFactory));
        vm.stopPrank();

        vm.prank(alice);
        address addr = vrfFactory.createCircle("VRF Circle", CONTRIBUTION, 3, 0);
        ArbiCycleCircle circle = ArbiCycleCircle(addr);

        _approveAndJoin(alice,   circle);
        _approveAndJoin(bob,     circle);
        _approveAndJoin(charlie, circle); // triggers VRF request

        assertTrue(circle.vrfPending(), "Should be waiting for VRF");
        assertEq(uint8(circle.state()), uint8(ArbiCycleCircle.CircleState.PENDING));

        // Simulate coordinator fulfilling randomness
        uint256[] memory randomWords = new uint256[](1);
        randomWords[0] = 42;
        mockVRF.fulfill(address(circle), circle.vrfRequestId(), randomWords);

        assertFalse(circle.vrfPending());
        assertEq(uint8(circle.state()), uint8(ArbiCycleCircle.CircleState.ACTIVE));

        uint256[] memory order = circle.getPayoutOrder();
        assertEq(order.length, 3);
    }

    function test_factoryRegistry() public {
        vm.prank(alice);
        address c1 = factory.createCircle("Circle 1", CONTRIBUTION, 3, 0);
        vm.prank(bob);
        address c2 = factory.createCircle("Circle 2", CONTRIBUTION, 5, 2);

        assertEq(factory.getCircleCount(), 2);
        assertEq(factory.getAllCircles()[0], c1);
        assertEq(factory.getAllCircles()[1], c2);
        assertTrue(factory.isCircle(c1));
        assertTrue(factory.isCircle(c2));
    }

    function test_duplicateJoinReverts() public {
        ArbiCycleCircle circle = _createCircle3();
        _approveAndJoin(alice, circle);
        vm.expectRevert(ArbiCycleCircle.AlreadyMember.selector);
        vm.prank(alice);
        circle.join();
    }

    function test_streamIdEmitted() public {
        ArbiCycleCircle circle = _createCircle3();
        _approveAndJoin(alice, circle);
        _approveAndJoin(bob, circle);
        _approveAndJoin(charlie, circle);

        address[3] memory mbrs = [alice, bob, charlie];

        // Complete round 0
        _completeRound(circle, mbrs, true);

        // In round 1: pick a non-recipient and check stream event
        address recipient1 = circle.getCurrentRecipient();
        address payer = address(0);
        for (uint256 i = 0; i < 3; i++) {
            if (mbrs[i] != recipient1) { payer = mbrs[i]; break; }
        }

        bytes32 expectedId = keccak256(abi.encodePacked(address(circle), payer, uint256(1)));

        vm.expectEmit(true, true, false, false, address(circle));
        emit ArbiCycleCircle.PaymentStreamExecuted(expectedId, payer, CONTRIBUTION, 1);

        vm.prank(payer);
        circle.contribute();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock VRF Coordinator
// ─────────────────────────────────────────────────────────────────────────────

contract MockVRFCoordinator {
    uint256 private _nextRequestId = 1;

    struct RandomWordsRequest {
        bytes32 keyHash;
        uint256 subId;
        uint16  requestConfirmations;
        uint32  callbackGasLimit;
        uint32  numWords;
        bytes   extraArgs;
    }

    function requestRandomWords(RandomWordsRequest calldata) external returns (uint256 requestId) {
        requestId = _nextRequestId++;
    }

    function fulfill(address consumer, uint256 requestId, uint256[] memory randomWords) external {
        ArbiCycleCircle(consumer).rawFulfillRandomWords(requestId, randomWords);
    }
}
