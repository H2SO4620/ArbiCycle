// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IReputationModule {
    function recordContribution(address member, bool onTime) external;
    function recordLatePayment(address member) external;
    function recordMissedPayment(address member) external;
    function recordRotationReceived(address member) external;
    function getScore(address member) external view returns (uint256);
    function getLendingLimit(address member) external view returns (uint256);
}
