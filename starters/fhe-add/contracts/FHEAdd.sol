// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @example-id fhe-add
 * @example-title Encrypted Addition Example
 * @example-level fundamental
 * @example-concepts euint8, encrypted-input, encrypted-addition
 * @example-summary Demonstrates how to take two encrypted inputs (A and B), store them in encrypted state, compute their encrypted sum, and let a user decrypt the result.
 *
 * @fhe-notes
 * - Uses euint8 for lightweight teaching example.
 * - Demonstrates FHE.fromExternal, FHE.add, and visibility control using FHE.allowThis and FHE.allow.
 * - No clear values are stored or revealed on-chain.
 */

/**
 * @contract FHEAdd
 * @role main
 * @description Stores two encrypted numbers and computes their encrypted sum.
 * @fhe-concepts encrypted-state, encrypted-addition, access-control
 * @pitfalls
 * - Contract never sees the clear values; do not attempt to decode them.
 * - Granting decrypt permission must always be explicit.
 */
contract FHEAdd is ZamaEthereumConfig {
    // Encrypted internal state
    euint8 private _a;
    euint8 private _b;
    euint8 private _a_plus_b;

    constructor() {}

    /**
     * @notice Stores encrypted input A into the contract.
     * @dev
     * - Converts encrypted external input into internal euint8.
     * - Grants contract permission to operate on ciphertext.
     *
     * @fhe-operations fromExternal
     * @fhe-visibility per-user
     *
     * @param inputA encrypted input handle for A
     * @param inputProof zk-proof verifying ciphertext validity
     */
    function setA(externalEuint8 inputA, bytes calldata inputProof) external {
        _a = FHE.fromExternal(inputA, inputProof);
        FHE.allowThis(_a);
    }

    /**
     * @notice Stores encrypted input B into the contract.
     * @dev
     * - Converts encrypted external input into internal euint8.
     * - Grants contract permission to operate on ciphertext.
     *
     * @fhe-operations fromExternal
     * @fhe-visibility per-user
     *
     * @param inputB encrypted input handle for B
     * @param inputProof zk-proof verifying ciphertext validity
     */
    function setB(externalEuint8 inputB, bytes calldata inputProof) external {
        _b = FHE.fromExternal(inputB, inputProof);
        FHE.allowThis(_b);
    }

    /**
     * @notice Computes the encrypted result of A + B.
     * @dev
     * - Executes encrypted addition on ciphertexts.
     * - Contract keeps permission on the result.
     * - Grants explicit permission to msg.sender to decrypt.
     *
     * @fhe-operations add
     * @fhe-visibility delegated-decrypt
     */
    function computeAPlusB() external {
        _a_plus_b = FHE.add(_a, _b);
        FHE.allowThis(_a_plus_b);
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
