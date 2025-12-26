// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract EncryptMultipleValues {
    // Store an arbitrary bytes payload per id (e.g., encrypted data)
    mapping(uint256 => bytes) public payloads;

    event Stored(uint256 indexed id, uint256 length);

    function store(uint256 id, bytes calldata data) external {
        payloads[id] = data;
        emit Stored(id, data.length);
    }

    function get(uint256 id) external view returns (bytes memory) {
        return payloads[id];
    }
}
