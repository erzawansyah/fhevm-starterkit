// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint8, externalEuint8} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title encrypt-multiple-values
/// @custom:label Encrypt Multiple Values
/// @notice Template awal yang akan di copy ke workspace/draft saat menjalankan `cli starter:add`.
/// @dev Details:
/// - Contoh paling sederhana dalam menggunakan FHE
/// - Anda bisa menambahkan komentar lagi disini
/// @dev Usage summary:
/// - Enkripsi nilai `uint8` menggunakan SDK FHEVM
/// - Kirim ciphertext dan proof ke `setValue`
/// - Ambil ciphertext tersimpan melalui `getResult` untuk proses decrypt
/// @dev Prerequisites:
/// - Jalankan kontrak pada lingkungan FHEVM mock atau jaringan yang mendukung
/// - Pemanggil menyiapkan proof valid untuk ciphertext eksternal
/// @author Muhamad Erza Wansyah
/// @custom:category fundamental
/// @custom:chapter basics
/// @custom:tags fhe, basic, draft
/// @custom:ui true
contract EncryptMultipleValues is ZamaEthereumConfig {
    /// @notice Ciphertext yang sudah disimpan sebagai `euint8` internal.
    euint8 private _value;

    constructor() {}

    /// @notice Menyimpan input terenkripsi ke state kontrak.
    /// @dev Memvalidasi proof melalui `FHE.fromExternal` sebelum menyimpan ciphertext.
    /// @param inputValue Ciphertext `euint8` eksternal dari pemanggil.
    /// @param inputProof Bukti zk yang memvalidasi ciphertext input.
    function setValue(externalEuint8 inputValue, bytes calldata inputProof) external {
        // Setiap komentar di dalam fungsi akan dipahami sebagai logic flow dari fungsi
        _value = FHE.fromExternal(inputValue, inputProof);
        // Izinkan kontrak menggunakan ciphertext yang baru disimpan untuk operasi lanjutan
        FHE.allowThis(_value);
        // Beri izin dekripsi kepada pengirim untuk mengambil hasil terenkripsi melalui oracle mock
        FHE.allow(_value, msg.sender);
    }

    /// @notice Mengembalikan ciphertext yang sudah disimpan.
    /// @return Ciphertext `euint8` yang tersimpan pada state.
    function getResult() public view returns (euint8) {
        return _value;
    }
}
