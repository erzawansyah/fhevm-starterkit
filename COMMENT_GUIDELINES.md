# Guideline Anotasi Komentar Kontrak dan Test

## Untuk Auto-Generate Dokumentasi FHEVM Example Hub

Dokumen ini menjelaskan standar komentar (anotasi) yang **WAJIB** dan **OPSIONAL** digunakan pada kontrak dan file test agar dokumentasi dapat digenerate secara otomatis, konsisten, dan edukatif.

Guideline ini dirancang untuk:

- mendukung automation dokumentasi
- menjaga kualitas example sebagai materi pembelajaran
- konsisten dengan constraint dan praktik sehat FHEVM

---

## Prinsip Umum

1. **Komentar adalah sumber dokumentasi utama**
   Semua informasi penting harus ada di NatSpec, bukan hanya di README.

2. **One Example = One Lesson**
   Komentar harus membantu developer memahami konsep FHE yang diajarkan, bukan sekadar API.

3. **Parser-first, reader-friendly**
   Format harus stabil untuk di-parse, tapi tetap enak dibaca manusia.

---

# Level Kontrak

## WAJIB

Setiap kontrak **harus** diawali dengan blok komentar NatSpec `/** */` yang berisi:

- `@title`
  Judul kontrak atau example.

- `@notice`
  Deskripsi singkat satu baris tentang tujuan kontrak.

- `@dev Usage summary:`
  Berisi langkah-langkah penggunaan kontrak dalam bentuk bullet list (minimal 1 poin).

### Contoh minimal

```solidity
/**
 * @title FHE Add
 * @notice Demonstrates addition on encrypted uint8 values using FHE.
 * @dev Usage summary:
 * - Submit encrypted inputs A and B
 * - Compute encrypted sum
 * - Decrypt result with granted permission
 */
```

## OPSIONAL (Sangat Dianjurkan)

- `@author`
- `@dev Prerequisites:`
  Jika kontrak butuh setup khusus (ciphertext proof, relayer, role).
- `@custom:security`
  Catatan permission, decrypt, atau trust model.
- `@custom:limitations`
  Batasan demo atau non-production.
- `@custom:performance`
  Catatan biaya FHE atau optimasi.

---

# Level State Variable dan Constant

## WAJIB

- `@notice` untuk **state variable utama** dan constant penting.

State variable utama adalah variabel yang:

- menyimpan ciphertext
- menyimpan hasil komputasi
- memengaruhi permission atau alur utama kontrak

### Contoh

```solidity
/// @notice Encrypted value of input A
euint8 private _a;
```

## OPSIONAL

- `@dev`
  Untuk menjelaskan lifecycle, kapan di-set, dan implikasinya.

---

# Level Fungsi

## WAJIB

- `@notice`
  One-liner tujuan fungsi.
- `@param`
  Untuk **setiap parameter** fungsi.

Jika ada parameter tanpa `@param`, dokumentasi dianggap tidak lengkap.

### Contoh

```solidity
/**
 * @notice Sets encrypted input A.
 * @param inputA Encrypted uint8 input.
 * @param inputProof Zero-knowledge proof for inputA.
 */
function setA(externalEuint8 inputA, bytes calldata inputProof) external;
```

## OPSIONAL

- `@dev`
  Penjelasan detail implementasi, edge case, atau workflow.
- `@return`
  Dianjurkan jika return value punya makna penting.
- `@custom:security`
- `@custom:limitations`
- `@custom:performance`

Catatan FHEVM:
Fungsi yang menghasilkan ciphertext baru atau mengatur permission **sangat dianjurkan** punya penjelasan security.

---

# Constructor

## WAJIB

- `@notice`
- `@param` untuk setiap parameter constructor (jika ada)

## OPSIONAL

- `@dev`
- `@custom:*`

---

# Struct

## WAJIB

- `@notice` pada definisi struct
- `@notice` pada field-field penting (terutama terenkripsi)

### Contoh

```solidity
/**
 * @notice Represents an encrypted receipt.
 */
struct Receipt {
    /// @notice Encrypted amount value
    euint32 amount;
}
```

## OPSIONAL

- `@dev` pada struct atau field untuk constraint dan aturan penggunaan.

---

# Enum

## WAJIB

- `@notice` pada enum

## OPSIONAL

- `@dev` untuk menjelaskan arti value atau aturan transisi state.

---

# Inline Comment di Dalam Fungsi

- **Tidak wajib**
- **Tidak di-parse** untuk dokumentasi
- Boleh digunakan bebas tanpa tag NatSpec

---

# Guideline Anotasi File Test

Komentar di test digunakan untuk mendokumentasikan **perilaku dan skenario**.

## Level File Test

### WAJIB

- `@title`
- `@notice`

### OPSIONAL

- `@dev Scenarios:`
  Daftar skenario pengujian utama.

### Contoh

```ts
/**
 * @title FHE Add Test
 * @notice Tests encrypted addition behavior.
 * @dev Scenarios:
 * - Valid encrypted inputs
 * - Permission to decrypt result
 */
```

---

## Level Suite (`describe`)

### WAJIB

- Tidak ada kewajiban parser

### OPSIONAL (Direkomendasikan)

- `@notice` tujuan suite
- `@dev Expected:` perilaku yang diharapkan

---

## Level Case (`it` / `test`)

### WAJIB

- Tidak ada kewajiban parser

### OPSIONAL

- `@notice` satu kalimat tentang apa yang divalidasi test tersebut

---

# Minimal Compliance Checklist

Agar example dianggap **valid untuk auto-doc**:

- Kontrak memiliki:

  - `@title`
  - `@notice`
  - `@dev Usage summary`

- Semua fungsi publik/eksternal punya:

  - `@notice`
  - Semua `@param`

- State variable utama punya `@notice`
- File test punya:

  - `@title`
  - `@notice`
