// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title Penjumlahan FHE
 * @author M.E.W
 * @notice Contoh sederhana untuk menjumlahkan nilai `euint8` terenkripsi menggunakan FHE.
 * @dev Usage summary:
 * - Simpan ciphertext input A dan B lewat `setA` dan `setB`.
 * - Jalankan `computeAPlusB` untuk menjumlahkan ciphertext.
 * - Ambil ciphertext hasil via `getResult`; pemanggil diberi izin decrypt setelah perhitungan.
 * @custom:limitations Kontrak demo; validasi input dan penanganan overflow mengikuti pustaka FHE.
 */
contract FHEAdd is ZamaEthereumConfig {
    /// @notice Ciphertext input A disimpan sebagai `euint8` internal.
    euint8 private _a;

    /// @notice Ciphertext input B disimpan sebagai `euint8` internal.
    euint8 private _b;

    /// @notice Ciphertext hasil A + B disimpan sebagai `euint8` internal.
    euint8 private _a_plus_b;

    /**
     * @notice Menyimpan input terenkripsi A ke state kontrak.
     * @dev Mengubah ciphertext eksternal menjadi `euint8` internal via `FHE.fromExternal`.
     * Bukti yang tidak valid akan menyebabkan transaksi revert; pemanggilan ulang menimpa nilai sebelumnya.
     * @param inputA Ciphertext `euint8` eksternal dari pemanggil.
     * @param inputProof Bukti zk yang memvalidasi ciphertext input.
     */
    function setA(externalEuint8 inputA, bytes calldata inputProof) external {
        _a = FHE.fromExternal(inputA, inputProof);
        FHE.allowThis(_a);
    }

    /**
     * @notice Menyimpan input terenkripsi B ke state kontrak.
     * @dev Mengubah ciphertext eksternal menjadi `euint8` internal via `FHE.fromExternal`.
     * Bukti yang tidak valid akan menyebabkan transaksi revert; pemanggilan ulang menimpa nilai sebelumnya.
     * @param inputB Ciphertext `euint8` eksternal dari pemanggil.
     * @param inputProof Bukti zk yang memvalidasi ciphertext input.
     */
    function setB(externalEuint8 inputB, bytes calldata inputProof) external {
        _b = FHE.fromExternal(inputB, inputProof);
        FHE.allowThis(_b);
    }

    /**
     * @notice Menjumlahkan input A dan B terenkripsi lalu menyimpan hasilnya.
     * @dev Prasyarat: `_a` sudah di-set via `setA` dan `_b` via `setB`.
     * Menjalankan penjumlahan homomorfik dan memberi izin decrypt kepada pemanggil untuk ciphertext hasil.
     * @custom:security Izin decrypt diberikan ke `msg.sender` untuk hasil; gunakan hanya dengan ciphertext dan bukti yang valid.
     */
    function computeAPlusB() external {
        require(FHE.isInitialized(_a), "Input A not set");
        require(FHE.isInitialized(_b), "Input B not set");

        _a_plus_b = FHE.add(_a, _b);

        FHE.allowThis(_a_plus_b);
        FHE.allow(_a_plus_b, msg.sender);
    }

    /**
     * @notice Mengembalikan ciphertext hasil penjumlahan A + B.
     * @dev Caller membutuhkan izin decrypt untuk membaca plaintext di luar chain.
     * @return Ciphertext `euint8` hasil penjumlahan homomorfik.
     */
    function getResult() public view returns (euint8) {
        return _a_plus_b;
    }
}
