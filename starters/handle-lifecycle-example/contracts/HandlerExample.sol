// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title handle-lifecycle-example
 * @notice Demonstrates how FHE handles work under the hood.
 * @author Zama Team
 * @dev Usage summary:
 * - Read the managed handle via `getHandle()` so callers can track the initialized ciphertext reference.
 * - Submit an external handle and proof to `compareHandles()` to observe how operations return new handles.
 * - Compare the returned pair to see that each arithmetic call produces a distinct handle.
 * @dev Details:
 * Handles are lightweight pointers to ciphertext inside the coprocessor, and `FHE.allowThis` keeps them usable.
 * @custom:category fundamental
 * @custom:chapter handles
 * @custom:tags Handles,Education
 * @custom:ui false
 */
contract HandleExample is ZamaEthereumConfig {
    /// @notice Encrypted placeholder for the tracked handle; zero handle is granted at deployment.
    euint32 private _storedValue;

    /// @notice Initializes the stored handle to zero and grants permission to reuse it.
    /// @dev The zero handle is created with `FHE.asEuint32(0)` and permission is granted through `FHE.allowThis`.
    constructor() {
        _storedValue = FHE.asEuint32(0);
        FHE.allowThis(_storedValue);
    }

    /// @notice Returns the raw handle ID for the stored value.
    /// @dev Handles are just uint256 identifiers pointing to data in the Coprocessor/Validator memory.
    /// @return handle The numeric ID referencing the stored ciphertext.
    function getHandle() external view returns (uint256) {
        return uint256(euint32.unwrap(_storedValue));
    }

    /// @notice Demonstrates that operations produce NEW handles.
    /// @param input External handle carrying an encrypted 32-bit value.
    /// @param inputProof Proof that binds the ciphertext to this transaction.
    /// @return originalHandle The handle of the input.
    /// @return newHandle The handle of the result (different).
    function compareHandles(
        externalEuint32 input,
        bytes calldata inputProof
    ) external returns (uint256 originalHandle, uint256 newHandle) {
        euint32 val = FHE.fromExternal(input, inputProof);
        FHE.allowThis(val);

        euint32 res = FHE.add(val, FHE.asEuint32(1));
        FHE.allowThis(res);

        return (uint256(euint32.unwrap(val)), uint256(euint32.unwrap(res)));
    }
}
