// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title A simple FHE counter contract
/// @notice Privacy-preserving counter storing an encrypted 32-bit value.
/// @author Zama Team
///
/// @dev Usage summary:
/// - Submit encrypted uint32 input with its proof
/// - Call increment() / decrement() for homomorphic update
/// - Permissions are granted so contract and caller can access ciphertext
/// - Retrieve the encrypted count via getCount()
///
/// @dev Details:
/// Demonstrates fundamental FHEVM arithmetic (add/sub) on encrypted state.
/// The contract never handles plaintext; all computations remain encrypted.
///
/// @custom:category applied
/// @custom:chapter basics
/// @custom:ui false
/// @custom:security Decryption requires prior permission; ciphertext access is restricted.
/// @custom:limitations No overflow/underflow checks; returns encrypted values only.
contract FHECounter is ZamaEthereumConfig {
    /// @notice Encrypted counter value
    /// @dev Stored as euint32; mutated via homomorphic add/sub.
    euint32 private _count;

    /// @notice Returns the current count
    /// @return The encrypted counter value (euint32).
    function getCount() external view returns (euint32) {
        return _count;
    }

    /// @notice Increments the counter by a specified encrypted value.
    /// @dev This example omits overflow/underflow checks for simplicity and readability.
    /// In a production contract, proper range checks should be implemented.
    /// @param inputEuint32 External encrypted uint32 value to add.
    /// @param inputProof Proof/attestation for the external ciphertext used by FHE.fromExternal.
    function increment(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        // Import the external ciphertext as an euint32, verifying its proof
        euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);

        // Homomorphically add the encrypted input to the encrypted state
        _count = FHE.add(_count, encryptedEuint32);

        // Grant access to the resulting ciphertext for this contract and the caller
        FHE.allowThis(_count);
        FHE.allow(_count, msg.sender);
    }

    /// @notice Decrements the counter by a specified encrypted value.
    /// @dev This example omits overflow/underflow checks for simplicity and readability.
    /// In a production contract, proper range checks should be implemented.
    /// @param inputEuint32 External encrypted uint32 value to subtract.
    /// @param inputProof Proof/attestation for the external ciphertext used by FHE.fromExternal.
    function decrement(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        // Import the external ciphertext as an euint32, verifying its proof
        euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);

        // Homomorphically subtract the encrypted input from the encrypted state
        _count = FHE.sub(_count, encryptedEuint32);

        // Grant access to the resulting ciphertext for this contract and the caller
        FHE.allowThis(_count);
        FHE.allow(_count, msg.sender);
    }
}
