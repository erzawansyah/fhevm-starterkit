// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title encrypted-access-control
 * @notice Demonstrates access control using encrypted roles and FHE permissions (allow vs allowTransient).
 * @dev Usage summary:
 * - Admin assigns an encrypted role (ebool) to a user (setEncryptedRole)
 * - Admin sets an encrypted secret value (setSecretValue)
 * - User reads the secret via readSecretTransient (temporary permission) or readSecretPersistent (persistent permission)
 *
 * @custom:security
 * - Role membership is encrypted. The contract never learns plaintext role.
 * - Decryption requires explicit permission. This example demonstrates both transient and persistent granting.
 *
 * @custom:limitations
 * - Single admin, single boolean role.
 * - Persistent permissions are dangerous in real apps if not revoked. This contract includes revoke helpers.
 */
contract EncryptedAccessControl is ZamaEthereumConfig {
    // -----------------------------
    // State
    // -----------------------------

    /// @notice Admin address that can manage roles and secret.
    address public admin;

    /// @notice Encrypted role: user => encrypted boolean (true means has access).
    mapping(address => ebool) private _role;

    /// @notice Encrypted secret stored in the contract.
    euint32 private _secret;

    /// @notice Tracks whether a user has been granted persistent decrypt permission for the secret.
    /// @dev This is plaintext metadata; it does not reveal the secret value or role value.
    mapping(address => bool) public hasPersistentSecretAccess;

    // -----------------------------
    // Events (plaintext)
    // -----------------------------

    /// @notice Emitted when admin changes a user's role ciphertext.
    event EncryptedRoleSet(address indexed user);

    /// @notice Emitted when secret ciphertext is updated.
    event SecretUpdated();

    /// @notice Emitted when persistent permission is granted.
    event PersistentAccessGranted(address indexed user);

    /// @notice Emitted when persistent permission is revoked.
    event PersistentAccessRevoked(address indexed user);

    // -----------------------------
    // Modifiers
    // -----------------------------

    /// @dev Restricts caller to admin.
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    // -----------------------------
    // Constructor
    // -----------------------------

    /**
     * @notice Initializes admin to deployer.
     */
    constructor() {
        admin = msg.sender;
    }

    // -----------------------------
    // Admin: Role Management
    // -----------------------------

    /**
     * @notice Assigns encrypted access role to a user.
     * @param user Address receiving the role.
     * @param role Encrypted boolean indicating access.
     * @param inputProof Zero-knowledge proof for `role`.
     */
    function setEncryptedRole(address user, externalEbool role, bytes calldata inputProof) external onlyAdmin {
        ebool r = FHE.fromExternal(role, inputProof);

        _role[user] = r;

        // Contract must be able to use stored ciphertext in computations.
        FHE.allowThis(_role[user]);

        emit EncryptedRoleSet(user);
    }

    /**
     * @notice Allows this contract to use the stored encrypted role for a given user.
     * @dev Useful if role ciphertext was migrated or if tooling wants an explicit "re-allowThis".
     * @param user Address whose role ciphertext is re-allowed for this contract.
     */
    function allowThisRole(address user) external onlyAdmin {
        FHE.allowThis(_role[user]);
    }

    // -----------------------------
    // Admin: Secret Management
    // -----------------------------

    /**
     * @notice Sets the encrypted secret value stored in this contract.
     * @param value Encrypted uint32 secret.
     * @param inputProof Zero-knowledge proof for `value`.
     */
    function setSecretValue(externalEuint32 value, bytes calldata inputProof) external onlyAdmin {
        euint32 s = FHE.fromExternal(value, inputProof);

        _secret = s;

        // Contract needs permission to use stored ciphertext.
        FHE.allowThis(_secret);

        emit SecretUpdated();
    }

    /**
     * @notice Re-allows the contract to use the stored secret ciphertext.
     * @dev Useful if secret ciphertext was migrated or tooling wants explicit allowThis.
     */
    function allowThisSecret() external onlyAdmin {
        FHE.allowThis(_secret);
    }

    // -----------------------------
    // Read: Transient vs Persistent
    // -----------------------------

    /**
     * @notice Reads the secret with transient permission (recommended default).
     * @dev This demonstrates FHE.allowTransient:
     * - If caller role is false, returns encrypted zero.
     * - Caller is granted decrypt permission only for the returned ciphertext in this transaction.
     * @return Encrypted result (either secret or zero).
     */
    function readSecretTransient() external returns (euint32) {
        ebool hasAccess = _role[msg.sender];

        // Conditional select: return secret if hasAccess is true, else return zero
        // This operation requires the contract to have permission on both _secret and the constant zero
        euint32 zero = FHE.asEuint32(0);
        FHE.allowThis(zero);

        euint32 out = FHE.select(hasAccess, _secret, zero);

        // Only temporary decrypt permission for the returned ciphertext.
        FHE.allowTransient(out, msg.sender);

        return out;
    }

    /**
     * @notice Grants persistent decrypt permission for the secret to `user`.
     * @dev This demonstrates FHE.allow:
     * - Persistent permission should be used sparingly and should have a revoke path.
     * - This function does not reveal the secret; it only changes permission metadata in FHEVM.
     * @param user Address to grant persistent secret decrypt permission.
     */
    function grantPersistentSecretAccess(address user) external onlyAdmin {
        // Persistently allow `user` to decrypt the secret ciphertext.
        FHE.allow(_secret, user);

        hasPersistentSecretAccess[user] = true;

        emit PersistentAccessGranted(user);
    }

    /**
     * @notice Revokes persistent decrypt permission flag for the secret from `user`.
     * @dev Some FHE permission systems may not support true revocation for already-granted ciphertext.
     * This helper is still useful as an application-level gate and for documentation.
     * @param user Address to revoke application-level access flag.
     */
    function revokePersistentSecretAccess(address user) external onlyAdmin {
        hasPersistentSecretAccess[user] = false;
        emit PersistentAccessRevoked(user);
    }

    /**
     * @notice Reads the secret for users with persistent access flag and encrypted role.
     * @dev This shows a common pattern:
     * - app-level gate (plaintext) plus encrypted role gate
     * - the ciphertext is already persistently allowed for the user (via grantPersistentSecretAccess)
     * @return Encrypted result (either secret or zero).
     */
    function readSecretPersistent() external returns (euint32) {
        require(hasPersistentSecretAccess[msg.sender], "No persistent access flag");

        ebool hasAccess = _role[msg.sender];
        euint32 zero = FHE.asEuint32(0);
        FHE.allowThis(zero);

        euint32 out = FHE.select(hasAccess, _secret, zero);

        // No transient permission granted here.
        // The user should already have persistent decrypt permission for `_secret`.
        // However, out is a new ciphertext. To ensure decrypt works reliably for the returned value,
        // you can grant allowTransient(out, msg.sender) OR persistently allow out as well.
        //
        // We choose transient permission for the output only (best of both worlds).
        FHE.allowTransient(out, msg.sender);

        return out;
    }

    // -----------------------------
    // Utility: Change Admin
    // -----------------------------

    /**
     * @notice Transfers admin role to a new address.
     * @param newAdmin New admin address.
     */
    function setAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Zero address");
        admin = newAdmin;
    }
}
