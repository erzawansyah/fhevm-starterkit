// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title FHE Add
 * @author M.E.W
 * @notice This contreact demonstrates how to perform addition on encrypted uint8 (`euint8`) values using Fully Homomorphic Encryption (FHE).
 * @dev Usage summary:
 * 1. Set encrypted inputs A and B using `setA` and `setB` functions.
 * 2. Compute the encrypted sum A + B using `computeAPlusB` function.
 * 3. Retrieve the encrypted result using the `result` function.
 */
contract FHEAdd is ZamaEthereumConfig {
    /// @notice Encrypted input A stored in internal `euint8` format.
    euint8 private _a;

    /// @notice Encrypted input B stored in internal `euint8` format.
    euint8 private _b;

    /// @notice Encrypted result of A + B stored in internal `euint8` format.
    euint8 private _a_plus_b;

    /**
     * @notice Store encrypted input A into the contract.
     * @dev Converts the external ciphertext into an internal `euint8` value using `FHE.fromExternal`.
     * The provided proof must be valid, otherwise the call will revert.
     * Calling this function again will overwrite the previously stored value.
     * @param inputA External encrypted uint8 value provided by the caller.
     * @param inputProof Zero-knowledge proof validating the encrypted input.
     */
    function setA(externalEuint8 inputA, bytes calldata inputProof) external {
        _a = FHE.fromExternal(inputA, inputProof);
        FHE.allowThis(_a);
    }

    /**
     * @notice Store encrypted input B into the contract.
     * @dev Converts the external ciphertext into an internal `euint8` value using `FHE.fromExternal`.
     * The provided proof must be valid, otherwise the call will revert.
     * Calling this function again will overwrite the previously stored value.
     * @param inputB External encrypted uint8 value provided by the caller.
     * @param inputProof Zero-knowledge proof validating the encrypted input.
     */
    function setB(externalEuint8 inputB, bytes calldata inputProof) external {
        _b = FHE.fromExternal(inputB, inputProof);
        FHE.allowThis(_b);
    }

    /**
     * @notice Compute the encrypted sum of inputs A and B.
     * @dev Prerequisites:
     * - Input A must be initialized using `setA`.
     * - Input B must be initialized using `setB`.
     * This function performs homomorphic addition on encrypted values and stores
     * the resulting ciphertext inside the contract.
     * The caller is granted permission to decrypt the result.
     * @custom:security This function should not be called with untrusted or invalid encrypted inputs.
     */
    function computeAPlusB() external {
        require(FHE.isInitialized(_a), "Input A not set");
        require(FHE.isInitialized(_b), "Input B not set");

        _a_plus_b = FHE.add(_a, _b);

        FHE.allowThis(_a_plus_b);
        FHE.allow(_a_plus_b, msg.sender);
    }

    /**
     * @notice Return the encrypted result of A + B.
     * @dev The returned value is an internal `euint8` handle.
     * The caller must have decryption permission to obtain the plaintext value off-chain.
     * @return The encrypted result of the homomorphic addition.
     */
    function getResult() public view returns (euint8) {
        return _a_plus_b;
    }
}
