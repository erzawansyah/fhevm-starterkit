// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, ebool, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title input-proof-example
 * @notice Input proofs and why they prevent ciphertext reuse
 * @author Zama Team
 * @custom:label InputProofExample Starter
 * @custom:category fundamental
 * @custom:chapter basics
 * @custom:ui false
 * @custom:security Critical: All external encrypted inputs MUST use FHE.fromExternal() with proof validation
 * @custom:concepts FHE.fromExternal, proof validation, ciphertext malling prevention
 * @dev In FHE, it is critical to verify that the sender knows the plaintext of the ciphertext they are submitting.
 * This prevents "Malling" attacks where an attacker copies a ciphertext from another user/transaction
 * and submits it as their own, potentially tricking the contract into performing unauthorized operations.
 * Key principle: FHE.fromExternal() verifies that the proof is cryptographically bound to msg.sender,
 * so only the original encryptor can use the ciphertext; proof verification fails for anyone else.
 */
contract InputProofExample is ZamaEthereumConfig {
    /// @notice Stores encrypted user value per address for demonstration
    /// @dev Maps user addresses to their encrypted state values
    mapping(address => euint32) private _userValue;

    /// @notice Counter for tracking proof validations (for audit/demo purposes)
    uint256 private _validationCount;

    /// @notice Event emitted when a value is successfully set with valid proof
    /// @param user Address of the user who set the value
    /// @param timestamp When the value was set
    event ValueSet(address indexed user, uint256 timestamp);

    /// @notice Event emitted when a value is retrieved
    /// @param user Address requesting the value
    /// @param timestamp When the value was retrieved
    event ValueRetrieved(address indexed user, uint256 timestamp);

    /// @notice Event emitted when proof validation succeeds
    /// @param user Address whose proof was validated
    /// @param validationCount Total number of validations so far
    event ProofValidated(address indexed user, uint256 validationCount);

    // ============= Single Value Operations =============

    /// @notice Sets a user's encrypted value using an input proof.
    /// @dev The `inputProof` is cryptographically bound to `msg.sender` and the `input` ciphertext.
    /// FHE.fromExternal() will revert if:
    /// - The proof is invalid
    /// - The proof is for a different sender
    /// - The proof was generated for different ciphertext
    ///
    /// This prevents an attacker from intercepting and reusing the ciphertext.
    /// @param input The externally encrypted value (from client-side encryption)
    /// @param inputProof The cryptographic proof that msg.sender knows the plaintext
    function setValue(externalEuint32 input, bytes calldata inputProof) external {
        // Verify proof and import the external ciphertext
        // This will REVERT if proof is invalid or not for msg.sender
        _userValue[msg.sender] = FHE.fromExternal(input, inputProof);

        // Grant permissions: the contract keeps using the value, msg.sender can decrypt it
        FHE.allowThis(_userValue[msg.sender]);
        FHE.allow(_userValue[msg.sender], msg.sender);

        // Increment validation counter for audit trail
        _validationCount++;

        emit ValueSet(msg.sender, block.timestamp);
        emit ProofValidated(msg.sender, _validationCount);
    }

    /// @notice Retrieves the caller's encrypted value without decrypting it on-chain
    /// @dev The value remains encrypted and can only be decrypted by the owner off-chain
    /// @return The encrypted euint32 value (handle/ciphertext)
    function getValue() external returns (euint32) {
        emit ValueRetrieved(msg.sender, block.timestamp);
        return _userValue[msg.sender];
    }

    /// @notice Reads the encrypted value (view only, no events)
    /// @dev Use this for internal calls that don't need to emit events
    /// @param user The address whose value to retrieve
    /// @return The encrypted euint32 value
    function getValueFor(address user) external view returns (euint32) {
        return _userValue[user];
    }

    // ============= Arithmetic Operations with Proof =============

    /// @notice Adds an encrypted value to the user's stored value using external encrypted input
    /// @dev Demonstrates how to perform operations on externally encrypted data
    /// Both values are encrypted; the operation is fully homomorphic
    /// @param input The externally encrypted amount to add
    /// @param inputProof The proof validating the external input
    function addToValue(externalEuint32 input, bytes calldata inputProof) external {
        // Import the external input with proof validation
        euint32 amount = FHE.fromExternal(input, inputProof);

        // Perform homomorphic addition on the encrypted values
        _userValue[msg.sender] = FHE.add(_userValue[msg.sender], amount);

        // Update permissions for the new ciphertext
        FHE.allowThis(_userValue[msg.sender]);
        FHE.allow(_userValue[msg.sender], msg.sender);

        _validationCount++;
        emit ProofValidated(msg.sender, _validationCount);
    }

    /// @notice Subtracts an encrypted value from the user's stored value
    /// @dev The subtraction is homomorphic; no decryption happens on-chain
    /// @param input The externally encrypted amount to subtract
    /// @param inputProof The proof validating the external input
    function subtractFromValue(externalEuint32 input, bytes calldata inputProof) external {
        // Import with proof validation
        euint32 amount = FHE.fromExternal(input, inputProof);

        // Perform homomorphic subtraction
        _userValue[msg.sender] = FHE.sub(_userValue[msg.sender], amount);

        FHE.allowThis(_userValue[msg.sender]);
        FHE.allow(_userValue[msg.sender], msg.sender);

        _validationCount++;
        emit ProofValidated(msg.sender, _validationCount);
    }

    /// @notice Multiplies the user's stored value by an externally encrypted factor
    /// @dev Demonstrates multiplication of encrypted values
    /// @param input The externally encrypted multiplier
    /// @param inputProof The proof validating the external input
    function multiplyValue(externalEuint32 input, bytes calldata inputProof) external {
        euint32 factor = FHE.fromExternal(input, inputProof);
        _userValue[msg.sender] = FHE.mul(_userValue[msg.sender], factor);
        FHE.allowThis(_userValue[msg.sender]);
        FHE.allow(_userValue[msg.sender], msg.sender);

        _validationCount++;
        emit ProofValidated(msg.sender, _validationCount);
    }

    // ============= Comparison Operations with Proof =============

    /// @notice Compares user's value with an external encrypted value
    /// @dev Returns an encrypted boolean (ebool)
    /// The comparison result is also encrypted; no plaintext comparison happens
    /// @param input The externally encrypted value to compare against
    /// @param inputProof The proof validating the external input
    /// @return encrypted boolean: true if user's value equals input
    function isEqualTo(externalEuint32 input, bytes calldata inputProof) external returns (ebool) {
        euint32 otherValue = FHE.fromExternal(input, inputProof);
        ebool result = FHE.eq(_userValue[msg.sender], otherValue);
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);

        _validationCount++;
        emit ProofValidated(msg.sender, _validationCount);

        return result;
    }

    /// @notice Checks if user's value is less than an external encrypted value
    /// @param input The externally encrypted value to compare against
    /// @param inputProof The proof validating the external input
    /// @return encrypted boolean: true if user's value < input
    function isLessThan(externalEuint32 input, bytes calldata inputProof) external returns (ebool) {
        euint32 otherValue = FHE.fromExternal(input, inputProof);
        ebool result = FHE.lt(_userValue[msg.sender], otherValue);
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);

        _validationCount++;
        emit ProofValidated(msg.sender, _validationCount);

        return result;
    }

    // ============= Conditional Operations with Proof =============

    /// @notice Conditionally sets value based on encrypted condition
    /// @dev FHE.select performs encrypted conditional: if condition==1, use trueVal, else use falseVal
    /// Demonstrates encrypted branching without revealing the condition on-chain
    /// @param condition Externally encrypted condition as euint32 (non-zero = true, 0 = false)
    /// @param conditionProof Proof for the condition
    /// @param trueValue Value to set if condition is true
    /// @param trueValueProof Proof for trueValue
    /// @return The selected encrypted value (condition determines which value was chosen)
    function conditionalSetValue(
        externalEuint32 condition,
        bytes calldata conditionProof,
        externalEuint32 trueValue,
        bytes calldata trueValueProof
    ) external returns (euint32) {
        // Validate both inputs
        euint32 condValue = FHE.fromExternal(condition, conditionProof);
        euint32 tVal = FHE.fromExternal(trueValue, trueValueProof);

        // FHE.select needs an ebool: treat any non-zero value as true
        ebool cond = FHE.ne(condValue, FHE.asEuint32(0));

        // Set a default false value (can be zero or another constant)
        euint32 fVal = FHE.asEuint32(0);

        // Encrypted select: reveals nothing about condition or values
        euint32 selected = FHE.select(cond, tVal, fVal);
        _userValue[msg.sender] = selected;
        FHE.allowThis(_userValue[msg.sender]);
        FHE.allow(_userValue[msg.sender], msg.sender);

        _validationCount += 2;
        emit ProofValidated(msg.sender, _validationCount);

        return selected;
    }

    // ============= Utility Functions =============

    /// @notice Gets the total number of validated proofs
    /// @dev Useful for auditing how many proof validations have occurred
    /// @return The count of proof validations since contract deployment
    function getValidationCount() external view returns (uint256) {
        return _validationCount;
    }

    /// @notice Resets user's value (for testing/reset scenarios)
    /// @dev Sets value to zero
    function reset() external {
        _userValue[msg.sender] = FHE.asEuint32(0);
        FHE.allowThis(_userValue[msg.sender]);
        FHE.allow(_userValue[msg.sender], msg.sender);
    }
}
