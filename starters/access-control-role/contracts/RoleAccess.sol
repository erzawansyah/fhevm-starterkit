// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title RoleAccess
/// @notice Simple role-based access control with assign/revoke
contract RoleAccess {
    mapping(bytes32 => mapping(address => bool)) public hasRole;
    bytes32 public constant ADMIN = keccak256("ADMIN");

    event RoleGranted(bytes32 indexed role, address indexed account);
    event RoleRevoked(bytes32 indexed role, address indexed account);

    constructor() {
        hasRole[ADMIN][msg.sender] = true;
    }

    modifier onlyRole(bytes32 role) {
        require(hasRole[role][msg.sender], "missing role");
        _;
    }

    function grantRole(bytes32 role, address account) external onlyRole(ADMIN) {
        hasRole[role][account] = true;
        emit RoleGranted(role, account);
    }

    function revokeRole(
        bytes32 role,
        address account
    ) external onlyRole(ADMIN) {
        hasRole[role][account] = false;
        emit RoleRevoked(role, account);
    }
}
