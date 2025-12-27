// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, ebool, euint32, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title user-decrypt-multiple-values
 * @notice Demonstrates user decryption of multiple encrypted values (bool, uint32, uint64) using FHE permissions.
 * @dev Usage summary:
 * - Call initialize(a, b, c) to compute encrypted results and grant `allowThis` + user permissions
 * - Use hre.fhevm.userDecrypt([handles...], keypair, signature, allowedAddresses, user, start, duration) to decrypt
 * - Ensure both contract (`allowThis`) and caller (`allow`) permissions are granted for user decryption to succeed
 * @custom:category applied
 * @custom:chapter decryption
 * @custom:ui false
 * @author Zama Team
 */
contract UserDecryptMultipleValues is ZamaEthereumConfig {
    ebool private _encryptedBool; // = 0 (uninitizalized)
    euint32 private _encryptedUint32; // = 0 (uninitizalized)
    euint64 private _encryptedUint64; // = 0 (uninitizalized)

    // solhint-disable-next-line no-empty-blocks
    constructor() {}

    /**
     * @notice Initializes the encrypted state using trivial formulas and grants permissions.
     * @param a Clear boolean input; stored as `a ^ false`.
     * @param b Clear uint32 input; stored as `b + 1` (mod 2^32).
     * @param c Clear uint64 input; stored as `c + 1` (mod 2^64).
     */
    function initialize(bool a, uint32 b, uint64 c) external {
        // Compute 3 trivial FHE formulas

        // _encryptedBool = a ^ false
        _encryptedBool = FHE.xor(FHE.asEbool(a), FHE.asEbool(false));

        // _encryptedUint32 = b + 1
        _encryptedUint32 = FHE.add(FHE.asEuint32(b), FHE.asEuint32(1));

        // _encryptedUint64 = c + 1
        _encryptedUint64 = FHE.add(FHE.asEuint64(c), FHE.asEuint64(1));

        // see `DecryptSingleValue.sol` for more detailed explanations
        // about FHE permissions and asynchronous user decryption requests.
        FHE.allowThis(_encryptedBool);
        FHE.allowThis(_encryptedUint32);
        FHE.allowThis(_encryptedUint64);

        FHE.allow(_encryptedBool, msg.sender);
        FHE.allow(_encryptedUint32, msg.sender);
        FHE.allow(_encryptedUint64, msg.sender);
    }

    /**
     * @notice Returns the encrypted boolean handle.
     * @return ebool The encrypted handle.
     */
    function encryptedBool() public view returns (ebool) {
        return _encryptedBool;
    }

    /**
     * @notice Returns the encrypted uint32 handle.
     * @return euint32 The encrypted handle.
     */
    function encryptedUint32() public view returns (euint32) {
        return _encryptedUint32;
    }

    /**
     * @notice Returns the encrypted uint64 handle.
     * @return euint64 The encrypted handle.
     */
    function encryptedUint64() public view returns (euint64) {
        return _encryptedUint64;
    }
}
