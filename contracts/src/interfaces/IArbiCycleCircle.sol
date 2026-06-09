// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

interface IArbiCycleCircle {
    enum CircleState { PENDING, ACTIVE, COMPLETED, CANCELLED }
    enum RotationFrequency { WEEKLY, BIWEEKLY, MONTHLY }

    function initialize(
        string calldata name,
        address admin,
        address usdc,
        address aavePool,
        address aUsdc,
        address reputationModule,
        uint256 contributionAmount,
        uint256 maxMembers,
        uint8   frequency,
        address vrfCoordinator,
        uint256 vrfSubId,
        bytes32 vrfKeyHash
    ) external;

    function join() external;
    function contribute() external;
    function triggerRotation() external;
    function getNextRotationTime() external view returns (uint256);
    function getCurrentPotValue() external view returns (uint256);
    function getMemberCount() external view returns (uint256);
    function isMember(address addr) external view returns (bool);
    function hasContributed(address addr) external view returns (bool);
    function getPayoutOrder() external view returns (uint256[] memory);
    function getStreamId(address member, uint256 round) external view returns (bytes32);
    function state() external view returns (CircleState);
    function currentRound() external view returns (uint256);
    function currentRecipientIdx() external view returns (uint256);
    function contributionAmount() external view returns (uint256);
    function maxMembers() external view returns (uint256);
    function name() external view returns (string memory);
    function vrfPending() external view returns (bool);
}
