// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint32, ebool, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title fhevm-anti-patterns-playground
 * @notice Single-contract collection of common FHEVM mistakes and their correct alternatives.
 * @author Zama Team
 * @dev Details:
 * This educational contract aggregates frequent pitfalls when working with FHEVM handles, permissions,
 * and encrypted computations, alongside the correct patterns. Some functions are intentionally unsafe
 * and may revert to illustrate the failure modes.
 *
 * @dev Usage summary:
 * - Call `initialize()` once to set zero handles and grant caller permissions.
 * - Use `setCorrectly()` then `useCorrectValue()` to see the correct lifecycle.
 * - Call `setIncorrectly()` then `useIncorrectValue()` to observe a typical revert when `allowThis()` is missing.
 * - Compare `setValueCorrect()` vs `setValueWrongUser()` to understand decrypt permissions.
 * - Compare `computeValueCorrect()` vs `computeValueWrong()` to understand result permissions.
 *
 * @custom:category patterns
 * @custom:chapter anti-patterns
 * @custom:tags Handles,Permissions,Education
 * @custom:ui false
 */
contract FHEVMAntiPatterns is ZamaEthereumConfig {
    // -------------------------
    // Storage
    // -------------------------
    euint32 private _value; // main stored value (correctly permissioned when used properly)
    euint32 private _result; // computed result (used for compute examples)

    // Intentionally "bad" storage: handle stored without allowThis, so contract cannot compute on it later
    euint32 private _unusableVal;

    bool private _initialized;

    // -------------------------
    // Init (no constructor)
    // -------------------------
    /// @notice Initializes storage handles to a known state.
    /// @dev Call once. This avoids using a constructor for educational templates.
    function initialize() external {
        require(!_initialized, "Already initialized");
        _initialized = true;

        _value = FHE.asEuint32(0);
        FHE.allowThis(_value);
        // Optional: allow caller to decrypt the initial value
        FHE.allow(_value, msg.sender);

        _result = FHE.asEuint32(0);
        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    // =========================================================
    // (A) Missing allowThis for stored handles
    // =========================================================

    /// @notice ✅ Correct: Always allowThis when storing a handle in contract state.
    /// @param inputEuint32 External encrypted value handle (euint32) bound to the caller.
    /// @param inputProof Cryptographic proof binding the ciphertext to this transaction.
    function setCorrectly(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        euint32 v = FHE.fromExternal(inputEuint32, inputProof);
        _value = v;

        FHE.allowThis(_value);
        FHE.allow(_value, msg.sender);
    }

    /// @notice ❌ Anti-Pattern: Forgetting allowThis() for a stored handle.
    /// @dev The contract will not be able to compute on _unusableVal later.
    /// @param inputEuint32 External encrypted value handle (euint32) bound to the caller.
    /// @param inputProof Cryptographic proof binding the ciphertext to this transaction.
    function setIncorrectly(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        _unusableVal = FHE.fromExternal(inputEuint32, inputProof);

        // MISSING (intentional):
        // FHE.allowThis(_unusableVal);
        // (Also missing allow() for user, so user cannot decrypt either.)
    }

    /// @notice ✅ Should succeed: compute on the correctly stored value.
    function useCorrectValue() external {
        euint32 res = FHE.add(_value, FHE.asEuint32(1));
        _value = res;

        FHE.allowThis(_value);
        FHE.allow(_value, msg.sender);
    }

    /// @notice ❌ Should fail: compute on the incorrectly stored value.
    /// @dev This likely reverts because address(this) is not in the ACL for _unusableVal.
    function useIncorrectValue() external {
        euint32 res = FHE.add(_unusableVal, FHE.asEuint32(1));
        _unusableVal = res;

        // Even if you allowThis after, it's too late if the add already reverted.
        FHE.allowThis(_unusableVal);
        FHE.allow(_unusableVal, msg.sender);
    }

    // =========================================================
    // (B) Wrong user in allow()
    // =========================================================

    /// @notice ✅ Correct: Grant decrypt permission to the actual caller (msg.sender).
    /// @param inputEuint32 External encrypted value handle (euint32) bound to the caller.
    /// @param inputProof Cryptographic proof binding the ciphertext to this transaction.
    function setValueCorrect(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        _value = FHE.fromExternal(inputEuint32, inputProof);

        FHE.allowThis(_value);
        FHE.allow(_value, msg.sender);
    }

    /// @notice ❌ Anti-Pattern: Grant permission to the wrong address.
    /// @dev msg.sender cannot decrypt if you allow() a different address.
    /// @param inputEuint32 External encrypted value handle (euint32) bound to the caller.
    /// @param inputProof Cryptographic proof binding the ciphertext to this transaction.
    /// @param wrongUser The address that mistakenly receives decrypt permission instead of the caller.
    function setValueWrongUser(externalEuint32 inputEuint32, bytes calldata inputProof, address wrongUser) external {
        _value = FHE.fromExternal(inputEuint32, inputProof);

        FHE.allowThis(_value);
        FHE.allow(_value, wrongUser);
    }

    // =========================================================
    // (C) Missing permissions for computed values
    // =========================================================

    /// @notice ✅ Correct: Permissions must be set for the computed result too.
    /// @param inputEuint32 External encrypted delta to add to the stored value.
    /// @param inputProof Cryptographic proof binding the ciphertext to this transaction.
    function computeValueCorrect(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        euint32 input = FHE.fromExternal(inputEuint32, inputProof);

        _result = FHE.add(_value, input);

        FHE.allowThis(_result);
        FHE.allow(_result, msg.sender);
    }

    /// @notice ❌ Anti-Pattern: Forgetting permissions for computed result.
    /// @dev User cannot decrypt _result (and sometimes later computations can break too).
    /// @param inputEuint32 External encrypted delta to add to the stored value.
    /// @param inputProof Cryptographic proof binding the ciphertext to this transaction.
    function computeValueWrong(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        euint32 input = FHE.fromExternal(inputEuint32, inputProof);

        _result = FHE.add(_value, input);

        // MISSING (intentional):
        // FHE.allowThis(_result);
        // FHE.allow(_result, msg.sender);
    }

    // -------------------------
    // Getters (handles)
    // -------------------------
    /// @notice Returns the raw handle ID for the stored value.
    /// @return handle Bytes32 identifier referencing the encrypted `_value`.
    function getValueHandle() external view returns (bytes32 handle) {
        return euint32.unwrap(_value);
    }

    /// @notice Returns the raw handle ID for the computed result.
    /// @return handle Bytes32 identifier referencing the encrypted `_result`.
    function getResultHandle() external view returns (bytes32 handle) {
        return euint32.unwrap(_result);
    }

    /// @notice Returns the raw handle ID for the intentionally mis-permissioned `_unusableVal`.
    /// @return handle Bytes32 identifier referencing the encrypted `_unusableVal`.
    function getUnusableHandle() external view returns (bytes32 handle) {
        return euint32.unwrap(_unusableVal);
    }
}
