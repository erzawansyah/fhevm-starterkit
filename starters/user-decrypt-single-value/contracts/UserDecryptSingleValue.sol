// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title user-decrypt-single-value
 * @notice Demonstrates user decryption of a single encrypted uint32 using FHE permissions.
 * @dev Usage summary:
 * - Call initializeUint32(value) to compute an encrypted result and grant permissions
 * - Use hre.fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, signer) to decrypt
 * - Avoid the common pitfall: forgetting FHE.allowThis(handle) will make user decryption fail
 * @custom:category applied
 * @custom:chapter decryption
 * @custom:ui false
 * @author Zama Team
 */
contract UserDecryptSingleValue is ZamaEthereumConfig {
    euint32 private _trivialEuint32;

    // solhint-disable-next-line no-empty-blocks
    constructor() {}

    /**
     * @notice Initializes `_trivialEuint32` with FHE as `(value + 1)` and grants user decryption permissions.
     * @param value The clear uint32 input, transformed to encrypted with FHE.asEuint32.
     */
    function initializeUint32(uint32 value) external {
        // Compute a trivial FHE formula _trivialEuint32 = value + 1
        _trivialEuint32 = FHE.add(FHE.asEuint32(value), FHE.asEuint32(1));

        // Grant FHE permissions to:
        // ✅ The contract caller (`msg.sender`): allows them to decrypt `_trivialEuint32`.
        // ✅ The contract itself (`address(this)`): allows it to operate on `_trivialEuint32` and
        //    also enables the caller to perform user decryption.
        //
        // Note: If you forget to call `FHE.allowThis(_trivialEuint32)`, the user will NOT be able
        //       to user decrypt the value! Both the contract and the caller must have FHE permissions
        //       for user decryption to succeed.
        FHE.allowThis(_trivialEuint32);
        FHE.allow(_trivialEuint32, msg.sender);
    }

    /**
     * @notice Initializes `_trivialEuint32` with FHE as `(value + 1)` but forgets to grant `allowThis`, causing user decryption to fail.
     * @param value The clear uint32 input.
     */
    function initializeUint32Wrong(uint32 value) external {
        // Compute a trivial FHE formula _trivialEuint32 = value + 1
        _trivialEuint32 = FHE.add(FHE.asEuint32(value), FHE.asEuint32(1));

        // ❌ Common FHE permission mistake:
        // ================================================================
        // We grant FHE permissions to the contract caller (`msg.sender`),
        // expecting they will be able to user decrypt the encrypted value later.
        //
        // However, this will fail! 💥
        // The contract itself (`address(this)`) also needs FHE permissions to allow user decryption.
        // Without granting the contract access using `FHE.allowThis(...)`,
        // the user decryption attempt by the user will not succeed.
        FHE.allow(_trivialEuint32, msg.sender);
    }

    /**
     * @notice Returns the encrypted uint32 result handle.
     * @return euint32 The encrypted handle representing the latest `_trivialEuint32` value.
     */
    function encryptedUint32() public view returns (euint32) {
        return _trivialEuint32;
    }
}
