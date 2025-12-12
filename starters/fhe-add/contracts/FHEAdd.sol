// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHEAdd Contract - Encrypted Addition of Two Numbers
/// @author M.E.W
/// @notice This contract will demonstrate how to perform addition on encrypted uint8 numbers using Fully Homomorphic Encryption (FHE).
/// @custom:section How it works:
/// - Users provide encrypted inputs along with zk-proofs to verify their validity.
/// - The contract uses FHE operations to compute the sum directly on the ciphertexts.
/// - Permissions are managed to ensure only authorized users can decrypt the result.
contract FHEAdd is ZamaEthereumConfig {
    /// @notice Encrypted uint8 variables to hold input A
    euint8 private _a;

    /// @notice Encrypted uint8 variable to hold input B
    euint8 private _b;

    /// @notice Encrypted uint8 variable to hold the result of A + B
    euint8 private _a_plus_b;

    /// @notice Stores encrypted input A into the contract.
    /// @param inputA chipertext handle for encrypted input A. Encrypted from the client side
    /// @param inputProof proof verifying the validity of the ciphertext
    function setA(externalEuint8 inputA, bytes calldata inputProof) external {
        /// @dev Convert external representation of input A to internal representation
        _a = FHE.fromExternal(inputA, inputProof);

        /// @dev Granted permission for contract to operate the chipertext
        FHE.allowThis(_a);
    }

    /// @notice Stores encrypted input B into the contract.
    /// @param inputB chipertext handle for encrypted input B. Encrypted from the client side
    /// @param inputProof proof verifying the validity of the ciphertext
    function setB(externalEuint8 inputB, bytes calldata inputProof) external {
        /// @dev Convert external representation of input B to internal representation
        _b = FHE.fromExternal(inputB, inputProof);

        /// @dev Granted permission for contract to operate the chipertext
        FHE.allowThis(_b);
    }

    /// @notice Computes the encrypted sum of A and B
    /// @dev The result is stored in the contract and permissions are set for the caller to decrypt it
    function computeAPlusB() external {
        /// @dev Ensure that both inputs have been initialized
        require(FHE.isInitialized(_a), "Input A not set");
        require(FHE.isInitialized(_b), "Input B not set");

        /// @dev Perform homomorphic addition on the encrypted inputs
        _a_plus_b = FHE.add(_a, _b);

        /// @dev Grant decrypt permissions to the contract itself to manage the result
        FHE.allowThis(_a_plus_b);
        /// @dev Grant decrypt permissions to the caller so they can access the result
        FHE.allow(_a_plus_b, msg.sender);
    }

    /**
     * @notice Returns the encrypted result of A + B.
     * @dev Caller must have decrypt permissions.
     * @return euint8 ciphertext of A+B
     */
    function result() public view returns (euint8) {
        return _a_plus_b;
    }
}
