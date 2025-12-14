// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title FHE Counter
 * @notice Demonstrates an encrypted counter that can be incremented or decremented using FHE.
 * @dev Usage summary:
 * - Users submit encrypted uint32 values along with valid proofs.
 * - The contract performs addition or subtraction directly on encrypted values.
 * - The resulting encrypted counter value is stored on-chain.
 * - Decryption permission for the result is granted to the caller.
 *
 * @dev Prerequisites:
 * - Inputs must be provided as encrypted values with valid zk-proofs.
 * - Callers must use an FHEVM-compatible client to encrypt and decrypt values.
 *
 * @custom:security
 * - The contract never accesses plaintext values; all operations are performed on ciphertexts.
 * - Decryption permission is explicitly granted to the caller after each update.
 *
 * @custom:limitations
 * - Overflow and underflow checks are intentionally omitted for simplicity.
 * - This contract is intended as a learning example and is not production-ready.
 */
contract FHECounter is ZamaEthereumConfig {
    /// @notice Encrypted counter value stored as an euint32.
    /// @dev The plaintext value of this counter is never visible to the contract.
    euint32 private _count;

    /**
     * @notice Returns the current encrypted counter value.
     * @dev The returned value is an encrypted uint32 and requires decrypt permission
     *      to be readable by the caller.
     * @return Encrypted counter value.
     */
    function getCount() external view returns (euint32) {
        return _count;
    }

    /**
     * @notice Increments the counter by a specified encrypted value.
     * @dev The function converts an external encrypted input into an internal euint32,
     *      then performs homomorphic addition with the stored counter.
     * @param inputEuint32 Encrypted uint32 value to add to the counter.
     * @param inputProof Zero-knowledge proof validating the encrypted input.
     *
     * @custom:security
     * - The resulting encrypted counter value is explicitly authorized
     *   for decryption by the caller.
     *
     * @custom:limitations
     * - No overflow checks are performed on the encrypted addition.
     */
    function increment(
        externalEuint32 inputEuint32,
        bytes calldata inputProof
    ) external {
        euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);

        _count = FHE.add(_count, encryptedEuint32);

        FHE.allowThis(_count);
        FHE.allow(_count, msg.sender);
    }

    /**
     * @notice Decrements the counter by a specified encrypted value.
     * @dev The function converts an external encrypted input into an internal euint32,
     *      then performs homomorphic subtraction with the stored counter.
     * @param inputEuint32 Encrypted uint32 value to subtract from the counter.
     * @param inputProof Zero-knowledge proof validating the encrypted input.
     *
     * @custom:security
     * - The resulting encrypted counter value is explicitly authorized
     *   for decryption by the caller.
     *
     * @custom:limitations
     * - No underflow checks are performed on the encrypted subtraction.
     */
    function decrement(
        externalEuint32 inputEuint32,
        bytes calldata inputProof
    ) external {
        euint32 encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);

        _count = FHE.sub(_count, encryptedEuint32);

        FHE.allowThis(_count);
        FHE.allow(_count, msg.sender);
    }
}
