// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, ebool, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title fhe-if-then-else
 * @notice Demonstrates selecting the maximum encrypted uint8 value using FHE comparisons.
 * @author Zama Team
 * @dev Usage summary:
 * - Send encrypted values via setA() and setB() with their respective input proofs
 * - Call computeMax() to compare and store the largest encrypted value
 * - Perform decryption via permission granted to computeMax() caller
 * @dev Prerequisites:
 * - FHEVM environment with hardhat-fhevm plugin
 * - Valid encrypted input proofs for each value
 * @custom:category fundamental
 * @custom:chapter basics
 * @custom:ui false
 * @custom:security Only the computeMax() caller receives decryption permission for the encrypted result
 */
contract FHEIfThenElse is ZamaEthereumConfig {
    /// @notice Encrypted operand A received via setA().
    /// @dev Stored as euint8 after verification via FHE.fromExternal.
    euint8 private _a;

    /// @notice Encrypted operand B received via setB().
    /// @dev Stored as euint8 after verification via FHE.fromExternal.
    euint8 private _b;

    /// @notice Encrypted maximum value between A and B.
    /// @dev Calculated via computeMax() using combination of FHE.ge and FHE.select.
    euint8 private _max;

    // solhint-disable-next-line no-empty-blocks
    /// @notice Initializes contract without setting initial encrypted values.
    constructor() {}

    /**
     * @notice Stores encrypted operand A using the provided proof.
     * @param inputA External ciphertext of type euint8 generated off-chain.
     * @param inputProof Encrypted input proof included with the ciphertext.
     */
    function setA(externalEuint8 inputA, bytes calldata inputProof) external {
        _a = FHE.fromExternal(inputA, inputProof);
        FHE.allowThis(_a);
    }

    /**
     * @notice Stores encrypted operand B using the provided proof.
     * @param inputB External ciphertext of type euint8 generated off-chain.
     * @param inputProof Encrypted input proof included with the ciphertext.
     */
    function setB(externalEuint8 inputB, bytes calldata inputProof) external {
        _b = FHE.fromExternal(inputB, inputProof);
        FHE.allowThis(_b);
    }

    /**
     * @notice Computes the encrypted maximum value between A and B and grants decryption permission to the caller.
     * @dev Uses FHE.ge for comparison and FHE.select to choose the largest value before permissions are granted.
     */
    function computeMax() external {
        // a >= b
        // solhint-disable-next-line var-name-mixedcase
        ebool _a_ge_b = FHE.ge(_a, _b);

        // a >= b ? a : b
        _max = FHE.select(_a_ge_b, _a, _b);

        // For more information about FHE permissions in this case,
        // read the `computeAPlusB()` commentaries in `FHEAdd.sol`.
        FHE.allowThis(_max);
        FHE.allow(_max, msg.sender);
    }

    /**
     * @notice Returns the stored encrypted maximum value.
     * @return Encrypted maximum value between operand A and B.
     */
    function result() public view returns (euint8) {
        return _max;
    }
}
