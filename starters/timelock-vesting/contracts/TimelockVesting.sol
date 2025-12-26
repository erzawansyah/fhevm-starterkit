// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title TimelockVesting
/// @notice Holds ETH for a beneficiary until `releaseTime`.
contract TimelockVesting {
    address public beneficiary;
    uint256 public releaseTime;

    event Released(address indexed to, uint256 amount);

    constructor(address _beneficiary, uint256 _releaseTime) payable {
        require(_releaseTime > block.timestamp, "release in past");
        beneficiary = _beneficiary;
        releaseTime = _releaseTime;
    }

    receive() external payable {}

    function release() external {
        require(block.timestamp >= releaseTime, "locked");
        uint256 amount = address(this).balance;
        require(amount > 0, "no funds");
        emit Released(beneficiary, amount);
    }
}
