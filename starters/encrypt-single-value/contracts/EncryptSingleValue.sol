// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, externalEuint32, euint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title encrypt-single-value
 * @notice Demonstrates receiving a single encrypted uint32 via FHE.fromExternal with proof-bound inputs.
 * @dev Usage summary:
 * - Use hre.fhevm.createEncryptedInput(contractAddress, user).add32(v).encrypt() to produce handles+proof
 * - Call initialize(handle, inputProof) from the bound user to store the encrypted value
 * - Decrypt later with hre.fhevm.userDecryptEuint(FhevmType.euint32, handle, contractAddress, user)
 * @custom:category applied
 * @custom:chapter encryption
 * @custom:ui false
 * @author Zama Team
 */
contract EncryptSingleValue is ZamaEthereumConfig {
    euint32 private _encryptedEuint32;

    // solhint-disable-next-line no-empty-blocks
    constructor() {}

    /**
     * @notice Stores the encrypted uint32 after verifying the external proof binding.
     * @param inputEuint32 The external encrypted uint32 handle produced off-chain.
     * @param inputProof The proof binding the handle to (contractAddress, sender).
     */
    function initialize(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        _encryptedEuint32 = FHE.fromExternal(inputEuint32, inputProof);

        // Grant FHE permission to both the contract itself (`address(this)`) and the caller (`msg.sender`),
        // to allow future decryption by the caller (`msg.sender`).
        FHE.allowThis(_encryptedEuint32);
        FHE.allow(_encryptedEuint32, msg.sender);
    }

    /**
     * @notice Returns the encrypted uint32 handle.
     * @return euint32 The encrypted handle.
     */
    function encryptedUint32() public view returns (euint32) {
        return _encryptedEuint32;
    }
}
