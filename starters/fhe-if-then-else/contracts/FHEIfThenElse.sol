// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, ebool, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title fhe-if-then-else
 * @notice Demonstrates selecting the maximum encrypted uint8 value using FHE comparisons.
 * @author Zama Team
 * @dev Usage summary:
 * - Kirim nilai terenkripsi melalui setA() dan setB() dengan input proof masing-masing
 * - Panggil computeMax() untuk membandingkan dan menyimpan nilai terenkripsi terbesar
 * - Lakukan dekripsi melalui izin yang diberikan ke pemanggil computeMax()
 * @dev Prerequisites:
 * - FHEVM environment dengan hardhat-fhevm plugin
 * - Bukti input terenkripsi yang valid untuk setiap nilai
 * @custom:category fundamental
 * @custom:chapter basics
 * @custom:ui false
 * @custom:security Hanya pemanggil computeMax() yang memperoleh izin dekripsi untuk hasil terenkripsi
 */
contract FHEIfThenElse is ZamaEthereumConfig {
    /// @notice Encrypted operand A yang diterima via setA().
    /// @dev Disimpan sebagai euint8 setelah diverifikasi melalui FHE.fromExternal.
    euint8 private _a;

    /// @notice Encrypted operand B yang diterima via setB().
    /// @dev Disimpan sebagai euint8 setelah diverifikasi melalui FHE.fromExternal.
    euint8 private _b;

    /// @notice Encrypted nilai maksimum antara A dan B.
    /// @dev Dihitung melalui computeMax() menggunakan kombinasi FHE.ge dan FHE.select.
    euint8 private _max;

    // solhint-disable-next-line no-empty-blocks
    /// @notice Menginisialisasi kontrak tanpa menetapkan nilai terenkripsi awal.
    constructor() {}

    /**
     * @notice Menyimpan operand A terenkripsi menggunakan proof yang diberikan.
     * @param inputA Ciphertext eksternal bertipe euint8 yang dihasilkan off-chain.
     * @param inputProof Bukti input terenkripsi yang disertakan bersama ciphertext.
     */
    function setA(externalEuint8 inputA, bytes calldata inputProof) external {
        _a = FHE.fromExternal(inputA, inputProof);
        FHE.allowThis(_a);
    }

    /**
     * @notice Menyimpan operand B terenkripsi menggunakan proof yang diberikan.
     * @param inputB Ciphertext eksternal bertipe euint8 yang dihasilkan off-chain.
     * @param inputProof Bukti input terenkripsi yang disertakan bersama ciphertext.
     */
    function setB(externalEuint8 inputB, bytes calldata inputProof) external {
        _b = FHE.fromExternal(inputB, inputProof);
        FHE.allowThis(_b);
    }

    /**
     * @notice Menghitung nilai maksimum terenkripsi antara A dan B dan memberikan izin dekripsi kepada pemanggil.
     * @dev Menggunakan FHE.ge untuk perbandingan dan FHE.select untuk memilih nilai terbesar sebelum izin diberikan.
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
     * @notice Mengembalikan nilai maksimum terenkripsi yang tersimpan.
     * @return Encrypted nilai maksimum antara operand A dan B.
     */
    function result() public view returns (euint8) {
        return _max;
    }
}
