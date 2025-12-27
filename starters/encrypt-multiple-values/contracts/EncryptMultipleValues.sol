// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title encrypt-multiple-values
/// @custom:label Encrypt Multiple Values
/// @notice Initial template that will be copied to workspace/draft when running `cli starter:add`.
/// @dev Details:
/// - Simplest example of using FHE
/// - You can add more comments here
/// @dev Usage summary:
/// - Encrypt `uint8` value using FHEVM SDK
/// - Send ciphertext and proof to `setValue`
/// - Retrieve stored ciphertext via `getResult` for decryption process
/// @dev Prerequisites:
/// - Run contract on FHEVM mock environment or supported network
/// - Caller prepares valid proof for external ciphertext
/// @author Muhamad Erza Wansyah
/// @custom:category fundamental
/// @custom:chapter basics
/// @custom:tags fhe, basic, draft
/// @custom:ui true
contract EncryptMultipleValues is ZamaEthereumConfig {
    /// @notice Ciphertext already stored as internal `euint8`.
    euint8 private _value;

    constructor() {}

    /// @notice Stores encrypted input to contract state.
    /// @dev Validates proof via `FHE.fromExternal` before storing ciphertext.
    /// @param inputValue External `euint8` ciphertext from caller.
    /// @param inputProof zk proof that validates input ciphertext.
    function setValue(externalEuint8 inputValue, bytes calldata inputProof) external {
        // Every comment inside function will be understood as logic flow of the function
        _value = FHE.fromExternal(inputValue, inputProof);
        // Allow contract to use the newly stored ciphertext for further operations
        FHE.allowThis(_value);
        // Grant decryption permission to sender to retrieve encrypted result via mock oracle
        FHE.allow(_value, msg.sender);
    }

    /// @notice Returns the stored ciphertext.
    /// @return Ciphertext `euint8` stored in state.
    function getResult() public view returns (euint8) {
        return _value;
    }
}
