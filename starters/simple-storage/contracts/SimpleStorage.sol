// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title SimpleStorage
/// @notice Minimal contract to store and retrieve a single uint256 value
/// @dev Intended as an educational starter contract
contract SimpleStorage {
    uint256 private value;

    /// @notice set stored value
    /// @param v value to store
    function set(uint256 v) public {
        value = v;
    }

    /// @notice get stored value
    /// @return the stored uint256 value
    function get() public view returns (uint256) {
        return value;
    }
}
