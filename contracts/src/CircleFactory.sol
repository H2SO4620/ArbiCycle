// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IArbiCycleCircle} from "./interfaces/IArbiCycleCircle.sol";
import {ReputationModule} from "./ReputationModule.sol";

/**
 * @title  CircleFactory
 * @author ArbiCycle
 * @notice Deploys ArbiCycleCircle minimal proxies (EIP-1167) and maintains
 *         a global on-chain registry of all circles.
 *
 * Gas profile: EIP-1167 clone deployment costs ~50k gas vs ~2M for a fresh deploy.
 * All circles share the same implementation bytecode; only storage differs.
 *
 * VRF configuration is set once at factory construction and forwarded to every
 * circle clone. On chains without Chainlink VRF (e.g. Robinhood Chain), deploy
 * with vrfCoordinator = address(0) to use the block-hash fallback.
 *
 * Arbitrum Sepolia VRF v2.5:
 *   Coordinator: 0x5CE8D5A2BC84beb22a398CCA51996F7930313D61
 *   Key hash:    0x027f94ff1465b3525f9fc03e9ff7d6d2c0953482246dd6ae07570c45d6631414
 *   LINK token:  0xb1D4538B4571d411F07960EF2838Ce337FE1E80E
 *
 * Robinhood Chain (Arbitrum Orbit L3):
 *   vrfCoordinator = address(0)  → block-hash shuffle fallback
 *   vrfSubId       = 0
 *   vrfKeyHash     = bytes32(0)
 */
contract CircleFactory is Ownable, ReentrancyGuard {
    using Clones for address;

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    address public immutable circleImplementation;
    ReputationModule public immutable reputationModule;

    // Protocol addresses — updatable by owner before launch
    address public usdc;
    address public aavePool;
    address public aUsdc;

    // VRF configuration — forwarded to every circle clone
    address public vrfCoordinator;
    uint256 public vrfSubscriptionId;
    bytes32 public vrfKeyHash;

    // Registry
    address[] public allCircles;
    mapping(address => address[]) public userCircles;   // user → circles
    mapping(address => bool)    public isCircle;
    mapping(address => address) public circleCreator;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event CircleCreated(
        address indexed circle,
        address indexed creator,
        string  name,
        uint256 contributionAmount,
        uint256 maxMembers,
        uint8   frequency
    );
    event ProtocolAddressesUpdated(address usdc, address aavePool, address aUsdc);
    event VRFConfigUpdated(address coordinator, uint256 subId, bytes32 keyHash);

    // ─────────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────────

    error ZeroAddress();
    error EmptyName();
    error NotACircle();

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor(
        address _circleImplementation,
        address _reputationModule,
        address _usdc,
        address _aavePool,
        address _aUsdc,
        address _owner,
        address _vrfCoordinator,  // address(0) = no VRF (Robinhood Chain fallback)
        uint256 _vrfSubId,
        bytes32 _vrfKeyHash
    ) Ownable(_owner) {
        if (_circleImplementation == address(0) || _reputationModule == address(0))
            revert ZeroAddress();

        circleImplementation = _circleImplementation;
        reputationModule     = ReputationModule(_reputationModule);
        usdc                 = _usdc;
        aavePool             = _aavePool;
        aUsdc                = _aUsdc;
        vrfCoordinator       = _vrfCoordinator;
        vrfSubscriptionId    = _vrfSubId;
        vrfKeyHash           = _vrfKeyHash;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Core
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Deploy a new ArbiCycle circle (EIP-1167 clone) and register it.
     * @param _name               Human-readable name (e.g. "Lagos Friday Ajo")
     * @param _contributionAmount USDC amount per round (6 decimals, min 1 USDC)
     * @param _maxMembers         Group size 3–50
     * @param _frequency          0=WEEKLY, 1=BIWEEKLY, 2=MONTHLY
     * @return circle             Address of the deployed circle proxy
     */
    function createCircle(
        string calldata _name,
        uint256 _contributionAmount,
        uint256 _maxMembers,
        uint8   _frequency
    ) external nonReentrant returns (address circle) {
        if (bytes(_name).length == 0) revert EmptyName();

        circle = circleImplementation.clone();

        IArbiCycleCircle(circle).initialize(
            _name,
            msg.sender,
            usdc,
            aavePool,
            aUsdc,
            address(reputationModule),
            _contributionAmount,
            _maxMembers,
            _frequency,
            vrfCoordinator,
            vrfSubscriptionId,
            vrfKeyHash
        );

        // Authorise new circle to record reputation events
        reputationModule.authoriseCircle(circle, true);

        allCircles.push(circle);
        isCircle[circle]        = true;
        circleCreator[circle]   = msg.sender;
        userCircles[msg.sender].push(circle);

        emit CircleCreated(
            circle,
            msg.sender,
            _name,
            _contributionAmount,
            _maxMembers,
            _frequency
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Registry helpers
    // ─────────────────────────────────────────────────────────────────────────

    function getAllCircles()  external view returns (address[] memory) { return allCircles; }
    function getCircleCount() external view returns (uint256) { return allCircles.length; }
    function getUserCircles(address user) external view returns (address[] memory) {
        return userCircles[user];
    }

    /**
     * @notice Called by a circle clone when a new member joins.
     * @dev    Only authorised circles may call this.
     */
    function registerMember(address user) external {
        if (!isCircle[msg.sender]) revert NotACircle();
        userCircles[user].push(msg.sender);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Owner — configuration
    // ─────────────────────────────────────────────────────────────────────────

    function setProtocolAddresses(
        address _usdc,
        address _aavePool,
        address _aUsdc
    ) external onlyOwner {
        if (_usdc == address(0) || _aavePool == address(0) || _aUsdc == address(0))
            revert ZeroAddress();
        usdc     = _usdc;
        aavePool = _aavePool;
        aUsdc    = _aUsdc;
        emit ProtocolAddressesUpdated(_usdc, _aavePool, _aUsdc);
    }

    /**
     * @notice Update VRF configuration for future circles.
     * @dev    Does not affect already-deployed circles.
     *         Set coordinator = address(0) to switch to block-hash fallback.
     */
    function setVRFConfig(
        address _vrfCoordinator,
        uint256 _vrfSubId,
        bytes32 _vrfKeyHash
    ) external onlyOwner {
        vrfCoordinator    = _vrfCoordinator;
        vrfSubscriptionId = _vrfSubId;
        vrfKeyHash        = _vrfKeyHash;
        emit VRFConfigUpdated(_vrfCoordinator, _vrfSubId, _vrfKeyHash);
    }
}
