// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IReputationModule} from "./interfaces/IReputationModule.sol";

/**
 * @title ReputationModule
 * @notice On-chain reputation scoring for ArbiCycle members.
 *         Scores unlock micro-lending limits across circles.
 *
 * Scoring model (max 1000 points):
 *   +10  on-time contribution
 *   +50  successfully completed rotation as recipient
 *   -20  late payment (within 24h window)
 *   -80  missed payment
 *
 * Lending limit: score / 1000 * MAX_LENDING_MULTIPLIER * baseContribution
 * (base formula — circles can override)
 */
contract ReputationModule is IReputationModule, Ownable {
    uint256 public constant MAX_SCORE = 1000;
    uint256 public constant INITIAL_SCORE = 100;

    int256 public constant SCORE_ON_TIME = 10;
    int256 public constant SCORE_LATE = -20;
    int256 public constant SCORE_MISSED = -80;
    int256 public constant SCORE_RECEIVED = 50;

    // Lending: score >= threshold → eligible for up to multiplier * last contribution USDC
    uint256 public constant LENDING_THRESHOLD = 300;
    uint256 public constant MAX_LENDING_MULTIPLIER = 5; // up to 5× contribution

    mapping(address => uint256) private _scores;
    mapping(address => uint256) private _totalContributions;
    mapping(address => uint256) private _totalOnTime;
    mapping(address => uint256) private _totalLate;
    mapping(address => uint256) private _totalMissed;
    mapping(address => uint256) private _rotationsReceived;

    // Authorised circles can update scores
    mapping(address => bool) public authorisedCircles;

    event ScoreUpdated(address indexed member, uint256 newScore, string reason);
    event CircleAuthorised(address indexed circle, bool status);

    error Unauthorised();
    error ZeroAddress();

    constructor(address initialOwner) Ownable(initialOwner) {}

    modifier onlyCircle() {
        if (!authorisedCircles[msg.sender]) revert Unauthorised();
        _;
    }

    function authoriseCircle(address circle, bool status) external onlyOwner {
        if (circle == address(0)) revert ZeroAddress();
        authorisedCircles[circle] = status;
        emit CircleAuthorised(circle, status);
    }

    function recordContribution(address member, bool onTime) external onlyCircle {
        _totalContributions[member]++;
        if (onTime) {
            _totalOnTime[member]++;
            _adjustScore(member, SCORE_ON_TIME, "on-time contribution");
        }
    }

    function recordLatePayment(address member) external onlyCircle {
        _totalLate[member]++;
        _adjustScore(member, SCORE_LATE, "late payment");
    }

    function recordMissedPayment(address member) external onlyCircle {
        _totalMissed[member]++;
        _adjustScore(member, SCORE_MISSED, "missed payment");
    }

    function recordRotationReceived(address member) external onlyCircle {
        _rotationsReceived[member]++;
        _adjustScore(member, SCORE_RECEIVED, "rotation received");
    }

    function getScore(address member) external view returns (uint256) {
        return _getScore(member);
    }

    function getLendingLimit(address member) external view returns (uint256) {
        uint256 score = _getScore(member);
        if (score < LENDING_THRESHOLD) return 0;
        // Returns multiplier (1–5) that caller applies to their base contribution
        uint256 multiplier = ((score - LENDING_THRESHOLD) * MAX_LENDING_MULTIPLIER) /
            (MAX_SCORE - LENDING_THRESHOLD);
        return multiplier == 0 ? 1 : multiplier;
    }

    function getStats(address member)
        external
        view
        returns (
            uint256 score,
            uint256 totalContributions,
            uint256 onTime,
            uint256 late,
            uint256 missed,
            uint256 rotationsReceived
        )
    {
        return (
            _getScore(member),
            _totalContributions[member],
            _totalOnTime[member],
            _totalLate[member],
            _totalMissed[member],
            _rotationsReceived[member]
        );
    }

    function _getScore(address member) internal view returns (uint256) {
        uint256 stored = _scores[member];
        // New members start at INITIAL_SCORE
        return stored == 0 ? INITIAL_SCORE : stored;
    }

    function _adjustScore(address member, int256 delta, string memory reason) internal {
        int256 current = int256(_getScore(member));
        int256 next = current + delta;
        if (next < 0) next = 0;
        if (next > int256(MAX_SCORE)) next = int256(MAX_SCORE);
        _scores[member] = uint256(next);
        emit ScoreUpdated(member, uint256(next), reason);
    }
}
