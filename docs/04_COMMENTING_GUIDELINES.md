# Guideline Anotasi Kontrak dan File Test

## Untuk Auto-Generate Metadata dan Dokumentasi FHEVM StarterKit

Dokumen ini menjelaskan standar **anotasi dan komentar** yang **WAJIB** dan **OPSIONAL** digunakan pada kontrak Solidity dan file test agar **metadata.json dapat di-generate secara otomatis** dari comment di contract file.

**Tujuan guideline ini:**

- Mendukung automation dan parsing dokumentasi
- Mengotomasi pembuatan metadata.json dari NatSpec comments
- Menjaga kualitas starter sebagai materi pembelajaran
- Konsisten dengan constraint dan praktik sehat FHEVM

---

## Table of Contents

1. [Mapping NatSpec ke metadata.json](#mapping-natspec-ke-metadatajson)
   - [Konsep Otomasi](#konsep-otomasi)
   - [Tag NatSpec untuk Metadata](#tag-natspec-untuk-metadata)
   - [Contoh Contract dengan Metadata Tags](#contoh-contract-dengan-metadata-tags)
   - [Aturan Parsing](#aturan-parsing)
   - [Validation Rules](#validation-rules)
2. [Prinsip Umum](#prinsip-umum)
3. [Level Kontrak](#level-kontrak)
4. [Level State Variable & Constant](#level-state-variable--constant)
5. [Level Fungsi](#level-fungsi)
6. [Constructor](#constructor)
7. [Struct](#struct)
8. [Enum](#enum)
9. [Inline Comment di Dalam Fungsi](#inline-comment-di-dalam-fungsi)
10. [Minimal Compliance Checklist](#minimal-compliance-checklist)
11. [Quick Reference: Metadata Tags](#quick-reference-metadata-tags)
12. [Error Handling & Troubleshooting](#error-handling--troubleshooting)
13. [Tools & Validation](#tools--validation)
14. [Related Documentation](#related-documentation)

---

## Mapping NatSpec ke metadata.json

### Konsep Otomasi

Sistem `starter:build` (dalam development) akan:

1. **Scan contract file** (`.sol`) untuk NatSpec comments
2. **Extract FHE operations** otomatis dari kode contract
3. **Parse package.json** untuk version dan dependencies
4. **Combine semua informasi** → **Generate metadata.json** yang comprehensive
5. **Metadata ini akan menjadi source of truth** untuk dokumentasi generation

Filosofinya: **Metadata yang kaya dan lengkap → Dokumentasi yang fleksibel dan maintainable**.

### Tag NatSpec untuk Metadata

Gunakan **custom tag** berikut di level **contract**. Semua akan disimpan di metadata untuk documentation generation:

| NatSpec Tag              | metadata.json Field   | Wajib | Format & Notes                                  |
| ------------------------ | --------------------- | ----- | ----------------------------------------------- |
| `@title`                 | `label`               | ✅    | String (1-100 char) - Short contract title      |
| `@notice`                | `description`         | ✅    | String (max 300 char) - One-liner purpose       |
| `@dev Details:`          | `details`             | ❌    | String (max 1000 char) - Full description       |
| `@custom:category`       | `category`            | ✅    | Enum: fundamental/patterns/applied/advanced     |
| `@custom:chapter`        | `chapter`             | ✅    | Enum: basics/encryption/decryption/etc.         |
| `@custom:tags`           | `tags`                | ❌    | Comma-separated: DeFi, Gaming, Governance, etc. |
| `@custom:ui`             | `has_ui`              | ✅    | Boolean: true/false                             |
| `@author`                | `authors[].name`      | ✅    | String (1-100 char) - Primary author/team       |
| `@custom:author-email`   | `authors[].email`     | ❌    | Valid email format                              |
| `@custom:author-url`     | `authors[].url`       | ❌    | Valid URI (GitHub profile, website, etc.)       |
| `@custom:additional-pkg` | `additional_packages` | ❌    | Format: `name@version` (comma-separated)        |

### Field yang Di-extract dari package.json

Beberapa field diambil dari `package.json` contract/starter:

| metadata.json Field | Sumber (package.json)                  | Notes                                 |
| ------------------- | -------------------------------------- | ------------------------------------- |
| `version`           | `version`                              | Starter version (semver)              |
| `fhevm_version`     | `dependencies` atau `peerDependencies` | Inferred dari package yang di-install |

### Field yang Di-generate Otomatis dari Code

| Field               | Sumber Otomatis                                         |
| ------------------- | ------------------------------------------------------- |
| `name`              | Nama file contract (lowercase with hyphens)             |
| `contract_name`     | Nama contract dari `contract <Name> { ... }`            |
| `contract_filename` | Nama file `.sol`                                        |
| `concepts`          | Di-extract dari semua `FHE.*` function calls dalam kode |
| `constructor_args`  | Di-parse dari `constructor(...)` signature              |

### Contoh Contract dengan Metadata Tags

```solidity
/**
 * @title Encrypted Counter with FHE
 * @notice Demonstrates encrypted counter operations with increment and decrement using FHE.
 * @author Zama Team
 * @custom:author-email team@zama.ai
 * @custom:author-url https://github.com/zama-ai
 *
 * @dev Details:
 * This contract showcases fundamental FHEVM operations for building privacy-preserving counters.
 * - Supports encrypted increment/decrement operations
 * - Maintains encrypted state throughout execution
 * - Requires proper permission grants for decryption
 * - Ideal for learning basic FHE arithmetic operations
 *
 * @dev Usage summary:
 * - Deploy contract with initial encrypted value
 * - Call increment() to add encrypted value
 * - Call decrement() to subtract encrypted value
 * - Grant permission before decryption
 * - Call getCounter() to retrieve encrypted value
 *
 * @custom:category fundamental
 * @custom:chapter basics
 * @custom:tags DeFi, Gaming
 * @custom:version 1.0.0
 * @custom:fhevm-version 0.5.0
 * @custom:ui false
 *
 * @dev Prerequisites:
 * - FHEVM environment (hardhat with fhevm plugin)
 * - Encryption keys for input proof
 *
 * @custom:security
 * - Only owner can decrypt counter value
 * - All operations are fully encrypted
 *
 * @custom:limitations
 * - euint8 type only (values 0-255)
 * - Single counter per contract instance
 */
contract FHECounter {
    euint8 private counter;
    address private owner;

    /**
     * @notice Initializes counter with encrypted initial value.
     * @param initialValue Encrypted initial counter value.
     */
    constructor(bytes calldata initialValue) {
        counter = FHE.asEuint8(initialValue);
        owner = msg.sender;
    }

    /**
     * @notice Increments the counter by 1.
     */
    function increment() external {
        counter = FHE.add(counter, FHE.asEuint8(1));
    }

    /**
     * @notice Decrements the counter by 1.
     */
    function decrement() external {
        counter = FHE.sub(counter, FHE.asEuint8(1));
    }

    /**
     * @notice Returns encrypted counter value.
     * @return Encrypted counter value.
     */
    function getCounter() external view returns (euint8) {
        return counter;
    }
}
```

### Hasil Generated metadata.json

```json
{
  "name": "fhe-counter",
  "contract_name": "FHECounter",
  "contract_filename": "FHECounter.sol",
  "label": "Encrypted Counter with FHE",
  "description": "Demonstrates encrypted counter operations with increment and decrement using FHE.",
  "details": "This contract showcases fundamental FHEVM operations for building privacy-preserving counters. Supports encrypted increment/decrement operations, maintains encrypted state throughout execution, requires proper permission grants for decryption. Ideal for learning basic FHE arithmetic operations.",
  "version": "1.0.0",
  "fhevm_version": "0.5.0",
  "category": "fundamental",
  "chapter": "basics",
  "concepts": ["FHE.asEuint8", "FHE.add", "FHE.sub"],
  "tags": ["DeFi", "Gaming"],
  "authors": [
    {
      "name": "Zama Team",
      "email": "team@zama.ai",
      "url": "https://github.com/zama-ai"
    }
  ],
  "has_ui": false,
  "constructor_args": ["bytes"],
  "additional_files": [],
  "additional_packages": []
}
```

**Penjelasan sumber data:**

- **Dari comments:** `label`, `description`, `details`, `category`, `chapter`, `tags`, `authors[]` (dengan email & url)
- **Dari package.json:** `version` (jika tidak ada di comment), `fhevm_version` (inferred dari dependencies)
- **Dari code scanning:** `name`, `contract_name`, `contract_filename`, `concepts[]`, `constructor_args[]`

### Aturan Parsing

1. **Multi-line values:** Tag seperti `@dev Details:` mengambil semua baris berikutnya hingga tag baru atau end of comment block
2. **Multiple authors:** Setiap `@author` tag membuat entry baru di array `authors[]`. Email dan URL akan match dengan author terdekat
3. **Comma-separated lists:** `@custom:tags` diparse sebagai comma-separated values
4. **Boolean parsing:** `@custom:ui true` atau `@custom:ui false` (case-insensitive)
5. **Package format:** `@custom:additional-pkg @openzeppelin/contracts@4.9.0, hardhat@2.19.0`
6. **FHE concept extraction:** Parser mencari pattern `FHE.<function>()` di seluruh contract body
7. **Version fallback:** Jika `@custom:version` tidak ada, ambil dari `package.json` version field
8. **FHEVM version inference:** Dari `hardhat-fhe` atau `fhevm` dependency version di package.json

### Validation Rules

Parser akan **reject contract** jika:

- ❌ Missing required tags: `@title`, `@notice`, `@author`, `@custom:category`, `@custom:chapter`, `@custom:ui`
- ❌ Invalid enum values untuk `category` atau `chapter`
- ❌ Description > 300 characters
- ❌ Details > 1000 characters
- ❌ Invalid email format di `@custom:author-email`
- ❌ Invalid URL format di `@custom:author-url`
- ❌ Contract name tidak match dengan filename (case-sensitive)
- ❌ `@custom:ui` bukan boolean (`true`/`false`)

**Note:** Jika field version tidak di-provide di comment, system akan fallback ke `package.json`.

### Metadata-First Philosophy

Metadata yang di-generate akan menjadi **single source of truth** untuk dokumentasi. Ini berarti:

1. **Semua field di metadata penting** - tidak ada yang redundant atau "nice to have"
2. **Documentation generation akan read dari metadata** - bukan dari contract file langsung
3. **README, API docs, dan listing semua derived dari metadata** - lebih maintainable
4. **Comments di contract adalah "structured data"** - bukan hanya for humans

**Keuntungan:**

- ✅ Dokumentasi selalu synchronized dengan contract
- ✅ Easy to update metadata → easy to update docs
- ✅ Flexible output: dapat generate berbagai format dari satu metadata
- ✅ Better UX: starterkit catalog, API reference, learning paths semua dari metadata yang sama

### Multi-Author Format

Untuk multiple authors, gunakan multiple `@author` tags:

```solidity
/**
 * @title MyContract
 * @notice Description
 * @author Alice Developer
 * @custom:author-email alice@example.com
 * @custom:author-url https://github.com/alice
 * @author Bob Developer
 * @custom:author-email bob@example.com
 * @custom:author-url https://github.com/bob
 * @custom:category fundamental
 * @custom:chapter basics
 * @custom:ui false
 */
contract MyContract {
    // ...
}
```

Hasil:

```json
{
  "authors": [
    {
      "name": "Alice Developer",
      "email": "alice@example.com",
      "url": "https://github.com/alice"
    },
    {
      "name": "Bob Developer",
      "email": "bob@example.com",
      "url": "https://github.com/bob"
    }
  ]
}
```

**Note:** Jika multiple author menggunakan `@custom:author-email`, parser harus matching dengan urutan `@author` terdekat di atasnya.

### Additional Packages Format

Untuk dependencies tambahan:

```solidity
/**
 * @custom:additional-pkg @openzeppelin/contracts@4.9.0, @openzeppelin/contracts-upgradeable@4.9.0
 */
```

Hasil:

```json
{
  "additional_packages": [
    {
      "name": "@openzeppelin/contracts",
      "version": "4.9.0"
    },
    {
      "name": "@openzeppelin/contracts-upgradeable",
      "version": "4.9.0"
    }
  ]
}
```

---

## Prinsip Umum

1. **Komentar adalah sumber dokumentasi utama**
   Semua informasi penting harus ada di NatSpec, bukan hanya di README.

2. **One Starter = One Learning Goal**
   Anotasi harus membantu developer memahami **konsep FHE yang diajarkan**, bukan hanya dokumentasi API.

3. **Parser-first, reader-friendly**
   Format harus stabil untuk di-parse otomatis, tapi tetap mudah dibaca.

4. **NatSpec Standard**
   Gunakan format Solidity NatSpec (/\*_ ... _/) yang merupakan standard industry.

---

## Level Kontrak

### WAJIB

Setiap kontrak **harus** diawali dengan blok NatSpec yang berisi:

#### `@title`

Judul/nama kontrak.

```solidity
/**
 * @title FHEAdd
```

#### `@notice`

Deskripsi **singkat satu baris** tentang tujuan kontrak dari sudut pandang user.

```solidity
 * @notice Demonstrates encrypted addition on uint8 values using FHE.
```

#### `@dev Usage summary:`

Berisi **bullet list** (minimal 1 poin) langkah-langkah penggunaan kontrak:

```solidity
 * @dev Usage summary:
 * - Submit two encrypted uint8 inputs A and B
 * - Compute encrypted result (A + B)
 * - Decrypt result with granted permission
```

### Contoh Minimal (Wajib)

```solidity
/**
 * @title FHEAdd
 * @notice Demonstrates encrypted addition on uint8 values using FHE.
 * @dev Usage summary:
 * - Submit encrypted inputs A and B
 * - Compute encrypted sum
 * - Decrypt result with granted permission
 */
contract FHEAdd {
    // ...
}
```

### OPSIONAL (Sangat Dianjurkan)

Tambahkan jika relevan dengan kontrak Anda:

#### `@author`

Nama author/creator.

```solidity
 * @author Zama Team
```

#### `@dev Prerequisites:`

Jika kontrak butuh setup khusus (ciphertext proof, relayer, role, dll).

```solidity
 * @dev Prerequisites:
 * - FHEVM environment (hardhat with fhevm plugin)
 * - Encryption key for permission grant
```

#### `@custom:security`

Catatan mengenai permission, decrypt, atau trust model.

```solidity
 * @custom:security Only owner can decrypt result
 * - Decrypt requires grantPermission() call first
```

#### `@custom:limitations`

Batasan demo atau non-production notes.

```solidity
 * @custom:limitations
 * - Example only, not production-ready
 * - Uint8 values only (upgrade for larger types)
```

#### `@custom:performance`

Catatan tentang gas cost atau optimasi FHE.

```solidity
 * @custom:performance
 * - FHE operations have fixed cost regardless of value
 * - Decryption is off-chain, scalable
```

### Contoh Lengkap

```solidity
/**
 * @title FHEAdd
 * @notice Demonstrates encrypted addition on uint8 values using FHE.
 * @author Zama Team
 * @dev Usage summary:
 * - Submit encrypted inputs A and B via setA() and setB()
 * - Call compute() to calculate encrypted sum
 * - Grant permission via grantPermit() before decrypt
 * - Call decrypt() to retrieve plaintext result
 * @dev Prerequisites:
 * - FHEVM environment (hardhat with fhevm plugin)
 * - Encryption keys for setA() and setB()
 * @custom:security
 * - Only owner can decrypt result
 * - Computation is fully encrypted, never reveals values
 * @custom:limitations
 * - Uint8 only (values 0-255)
 * - Single computation per contract instance
 * @custom:performance
 * - setA/setB: ~100k gas
 * - compute: ~50k gas (encrypted operation)
 * - decrypt: off-chain (no gas)
 */
contract FHEAdd {
    // ...
}
```

---

## Level State Variable & Constant

### WAJIB

**State variable utama** harus punya `@notice`. State variable utama adalah yang:

- Menyimpan ciphertext atau encrypted values
- Menyimpan hasil komputasi terenkripsi
- Memengaruhi permission atau alur utama kontrak

```solidity
contract FHEAdd {
    /// @notice Encrypted value of input A
    euint8 private encryptedA;

    /// @notice Encrypted value of input B
    euint8 private encryptedB;

    /// @notice Encrypted sum result (A + B)
    euint8 private encryptedSum;
```

### OPSIONAL

#### `@dev`

Untuk menjelaskan lifecycle, kapan di-set, dan implikasinya.

```solidity
    /// @notice Encrypted value of input A
    /// @dev Set via setA(), immutable after computation
    euint8 private encryptedA;
```

### Catatan

State variable "helper" (non-critical) tidak wajib punya anotasi:

```solidity
    address private owner;  // Simple, tidak perlu anotasi
    uint256 private nonce;  // Helper, tidak critical untuk education
```

---

## Level Fungsi

### WAJIB

Setiap **fungsi publik/eksternal** harus punya:

#### `@notice`

One-liner tujuan fungsi (dari sudut pandang user).

```solidity
    /// @notice Sets encrypted input A with proof.
```

#### `@param`

**Untuk setiap parameter**. Jika ada parameter tanpa `@param`, dokumentasi dianggap **tidak lengkap**.

```solidity
    /// @param encryptedInput Encrypted uint8 value to set as A
    /// @param inputProof Zero-knowledge proof for encryptedInput
```

### Contoh (Wajib)

```solidity
/**
 * @notice Sets encrypted input A.
 * @param encryptedInput Encrypted uint8 input value.
 * @param inputProof Zero-knowledge proof for the encrypted input.
 */
function setA(bytes calldata encryptedInput, bytes calldata inputProof) external {
    // ...
}
```

### OPSIONAL

#### `@dev`

Penjelasan detail implementasi, edge case, workflow.

```solidity
    /// @dev Internal state mutation: stores encrypted value in encryptedA
```

#### `@return`

Dianjurkan jika return value punya makna penting.

```solidity
    /// @return result Encrypted sum of A + B
    function getSum() external view returns (euint8) {
        return encryptedSum;
    }
```

#### `@custom:security`, `@custom:limitations`, `@custom:performance`

Catatan khusus untuk fungsi spesifik.

```solidity
    /**
     * @notice Decrypts and returns the result.
     * @return result Plaintext sum value.
     * @custom:security Requires prior grantPermission() call
     * @custom:performance Off-chain decryption, scalable
     */
    function decrypt() external view returns (uint8) {
        // ...
    }
```

### Fungsi Private/Internal

**Tidak wajib** anotasi, tapi **SANGAT DIANJURKAN** jika:

- Fungsi penting untuk memahami alur
- Fungsi di-override dari base contract

```solidity
    /// @notice Internal helper to validate encrypted input proof
    function _validateProof(bytes calldata proof) internal pure {
        // ...
    }
```

---

## Constructor

### WAJIB

- `@notice` — Deskripsi tujuan constructor
- `@param` untuk **setiap parameter** (jika ada)

```solidity
/**
 * @notice Initializes the contract with owner.
 * @param initialOwner Address of the contract owner.
 */
constructor(address initialOwner) {
    owner = initialOwner;
}
```

### OPSIONAL

- `@dev` — Setup details atau initial state
- `@custom:*` — Custom tags jika relevan

```solidity
/**
 * @notice Initializes the contract.
 * @param initialOwner Owner address for permission control.
 * @dev Sets owner and initializes encrypted value to zero.
 */
```

---

## Struct

### WAJIB

- `@notice` pada **definisi struct**
- `@notice` pada **field-field penting** (terutama terenkripsi)

```solidity
/**
 * @notice Represents an encrypted transaction record.
 */
struct EncryptedTransaction {
    /// @notice Encrypted amount value
    euint64 encryptedAmount;

    /// @notice Encrypted recipient address
    euint256 encryptedTo;

    /// @notice Timestamp of transaction
    uint256 timestamp;
}
```

### OPSIONAL

- `@dev` pada struct atau field untuk constraint dan aturan penggunaan

```solidity
    /**
     * @notice Encrypted transaction data.
     * @dev Immutable after creation, only readable via decrypt()
     */
    struct Transaction {
        euint64 amount;
        // ...
    }
```

---

## Enum

### WAJIB

- `@notice` pada **enum definition**

```solidity
/// @notice Status of encrypted transaction
enum TransactionStatus {
    Pending,    // Waiting for confirmation
    Confirmed,  // Confirmed and executed
    Failed      // Failed or reverted
}
```

### OPSIONAL

- `@dev` untuk menjelaskan arti value atau aturan transisi state

```solidity
/**
 * @notice Transaction lifecycle status.
 * @dev Valid transitions: Pending → Confirmed/Failed (no reverse)
 */
enum Status {
    Pending,
    Confirmed,
    Failed
}
```

---

## Inline Comment di Dalam Fungsi

**Tidak wajib** untuk dokumentasi otomatis, **TIDAK akan di-parse**.

Gunakan bebas untuk menjelaskan logic:

```solidity
function setA(bytes calldata input, bytes calldata proof) external {
    // Validate input proof first
    require(isValidProof(proof), "Invalid proof");

    // Store encrypted value
    encryptedA = FHE.asEuint8(input);
}
```

---

## Minimal Compliance Checklist

Untuk starter dianggap **valid** (siap untuk auto-doc, auto-generate metadata, dan publication):

### Contract Level - Required Metadata Tags

- [ ] Punya `@title` (digunakan untuk `label`)
- [ ] Punya `@notice` (digunakan untuk `description`, max 300 chars)
- [ ] Punya `@author` (minimal 1 author)
- [ ] Punya `@custom:category` dengan value valid: `fundamental`, `patterns`, `applied`, atau `advanced`
- [ ] Punya `@custom:chapter` dengan value valid sesuai schema (basics, encryption, decryption, dll.)
- [ ] Punya `@custom:ui` dengan value `true` atau `false`
- [ ] Punya `@dev Usage summary:` dengan minimal 1 bullet point

### Contract Level - Optional but Recommended

- [ ] `@dev Details:` untuk deskripsi lengkap (max 1000 chars, digunakan untuk `details`)
- [ ] `@custom:tags` untuk kategorisasi tambahan (DeFi, Gaming, Governance, dll.)
- [ ] `@custom:version` untuk versioning contract
- [ ] `@custom:fhevm-version` untuk kompatibilitas FHEVM
- [ ] `@custom:author-email` dan `@custom:author-url` untuk kontak author
- [ ] `@custom:additional-pkg` jika memerlukan dependency tambahan
- [ ] `@dev Prerequisites:` untuk setup requirements
- [ ] `@custom:security`, `@custom:limitations`, `@custom:performance`

### Contract Level - State Variables

- [ ] Semua state variable encrypted (euint\*, ebool, eaddress) punya `@notice`

### Function Level

- [ ] Semua fungsi public/external punya `@notice`
- [ ] Semua fungsi public/external punya `@param` untuk **setiap parameter**
- [ ] Constructor (jika ada) punya `@notice` dan `@param`
- [ ] Fungsi yang return value punya `@return`

### Test Level

- [ ] File test punya `@title` dan `@notice` (lihat [05_TESTING_GUIDELINES.md](05_TESTING_GUIDELINES.md))
- [ ] Minimal satu test case (tidak boleh kosong)

### Metadata Generation Validation

- [ ] Contract name match dengan filename (case-sensitive)
- [ ] Email format valid (jika menggunakan `@custom:author-email`)
- [ ] URL format valid (jika menggunakan `@custom:author-url`)
- [ ] Description tidak melebihi 300 characters
- [ ] Details (jika ada) tidak melebihi 1000 characters
- [ ] Category dan chapter menggunakan value dari enum yang valid
- [ ] Package format: `name@version` (jika menggunakan `@custom:additional-pkg`)

### Contoh Valid Starter (Ready for Auto-Generation)

**Contoh: `fhe-add/contracts/FHEAdd.sol`**

```solidity
/**
 * @title Encrypted Addition Demo
 * @notice Demonstrates encrypted addition on uint8 values using FHE.
 * @author Zama Team
 * @custom:author-email team@zama.ai
 * @custom:author-url https://github.com/zama-ai
 *
 * @dev Details:
 * This starter demonstrates the most fundamental FHE operation: encrypted addition.
 * Perfect for developers new to FHEVM who want to understand how encrypted arithmetic works.
 * Shows proper input handling with proofs, encrypted computation, and result decryption.
 *
 * @dev Usage summary:
 * - Call setA() with encrypted uint8 input and proof
 * - Call setB() with encrypted uint8 input and proof
 * - Call compute() to calculate encrypted sum
 * - Grant permission via grantPermission()
 * - Call decrypt() to retrieve plaintext result
 *
 * @custom:category fundamental
 * @custom:chapter basics
 * @custom:tags DeFi
 * @custom:version 1.0.0
 * @custom:fhevm-version 0.5.0
 * @custom:ui false
 *
 * @dev Prerequisites:
 * - FHEVM environment (hardhat with fhevm plugin)
 * - Encryption keys for input proofs
 *
 * @custom:security
 * - Only owner can decrypt result
 * - All values remain encrypted throughout execution
 *
 * @custom:limitations
 * - Uint8 only (values 0-255)
 * - Overflow wraps around (no revert)
 */
contract FHEAdd {
    /// @notice Encrypted input A
    euint8 private encryptedA;

    /// @notice Encrypted input B
    euint8 private encryptedB;

    /// @notice Encrypted result (A + B)
    euint8 private encryptedSum;

    /// @notice Contract owner (can decrypt)
    address private owner;

    /**
     * @notice Initializes contract with owner address.
     * @param initialOwner Address that can decrypt results.
     */
    constructor(address initialOwner) {
        owner = initialOwner;
    }

    /**
     * @notice Sets encrypted input A.
     * @param input Encrypted uint8 value.
     * @param inputProof Zero-knowledge proof for input validity.
     */
    function setA(bytes calldata input, bytes calldata inputProof) external {
        encryptedA = FHE.asEuint8(input);
    }

    /**
     * @notice Sets encrypted input B.
     * @param input Encrypted uint8 value.
     * @param inputProof Zero-knowledge proof for input validity.
     */
    function setB(bytes calldata input, bytes calldata inputProof) external {
        encryptedB = FHE.asEuint8(input);
    }

    /**
     * @notice Computes encrypted sum (A + B).
     * @dev Stores result in encryptedSum state variable.
     */
    function compute() external {
        encryptedSum = FHE.add(encryptedA, encryptedB);
    }

    /**
     * @notice Grants permission for caller to decrypt result.
     */
    function grantPermission() external {
        FHE.allow(encryptedSum, msg.sender);
    }

    /**
     * @notice Decrypts and returns plaintext result.
     * @return Plain uint8 sum value.
     * @custom:security Requires prior grantPermission() call.
     */
    function decrypt() external view returns (uint8) {
        require(msg.sender == owner, "Only owner can decrypt");
        return FHE.decrypt(encryptedSum);
    }
}
```

**Generated metadata.json:**

```json
{
  "name": "fhe-add",
  "contract_name": "FHEAdd",
  "contract_filename": "FHEAdd.sol",
  "label": "Encrypted Addition Demo",
  "description": "Demonstrates encrypted addition on uint8 values using FHE.",
  "details": "This starter demonstrates the most fundamental FHE operation: encrypted addition. Perfect for developers new to FHEVM who want to understand how encrypted arithmetic works. Shows proper input handling with proofs, encrypted computation, and result decryption.",
  "version": "1.0.0",
  "fhevm_version": "0.5.0",
  "category": "fundamental",
  "chapter": "basics",
  "concepts": ["FHE.asEuint8", "FHE.add", "FHE.allow", "FHE.decrypt"],
  "tags": ["DeFi"],
  "authors": [
    {
      "name": "Zama Team",
      "email": "team@zama.ai",
      "url": "https://github.com/zama-ai"
    }
  ],
  "has_ui": false,
  "constructor_args": ["address"],
  "additional_files": [],
  "additional_packages": []
}
```

**Sumber data per field:**

- **Comments:** `label`, `description`, `details`, `category`, `chapter`, `tags`, `authors[]`
- **Code scanning:** `name`, `contract_name`, `contract_filename`, `concepts[]`, `constructor_args[]`
- **package.json:** `version`, `fhevm_version` (jika tidak di-override di comments)

**Contoh: `fhe-add/test/FHEAdd.ts`**

```typescript
/**
 * @title FHEAdd Tests
 * @notice Tests encrypted addition behavior.
 */
describe("FHEAdd", () => {
  it("should compute correct sum", async () => {
    // Test implementation
  });
});
```

---

## Quick Reference: Metadata Tags

### Contract-Level Required Tags

```solidity
/**
 * @title <String 1-100 chars>                           → metadata.label
 * @notice <String max 300 chars>                        → metadata.description
 * @author <String 1-100 chars>                          → metadata.authors[].name
 * @custom:category <fundamental|patterns|applied|advanced> → metadata.category
 * @custom:chapter <basics|encryption|decryption|...>    → metadata.chapter
 * @custom:ui <true|false>                               → metadata.has_ui
 */
```

### Contract-Level Optional Tags

```solidity
/**
 * @dev Details: <String max 1000 chars>                 → metadata.details
 * @custom:tags <DeFi, Gaming, Governance, ...>          → metadata.tags[]
 * @custom:version <semver>                              → metadata.version
 * @custom:fhevm-version <semver>                        → metadata.fhevm_version
 * @custom:author-email <valid-email>                    → metadata.authors[].email
 * @custom:author-url <valid-uri>                        → metadata.authors[].url
 * @custom:additional-pkg <name@version, ...>            → metadata.additional_packages[]
 */
```

### Auto-Generated Fields (No Tag Needed)

- `name` → lowercase contract filename with hyphens
- `contract_name` → extracted from `contract <Name> { ... }`
- `contract_filename` → `.sol` filename
- `concepts` → all `FHE.*()` function calls found in code
- `constructor_args` → parsed from `constructor(...)` signature

### Valid Enum Values

**category:**

- `fundamental` — Basic FHE operations
- `patterns` — Design patterns and best practices
- `applied` — Real-world use cases
- `advanced` — Complex implementations

**chapter:**

- `basics` — Introduction to FHE operations
- `encryption` — Encryption techniques
- `decryption` — Decryption and permission
- `access-control` — Permission management
- `inputproof` — Input validation and proofs
- `anti-patterns` — Things to avoid
- `handles` — Working with encrypted handles
- `openzeppelin` — OpenZeppelin integration
- `advanced` — Advanced topics

**tags (predefined, or custom string):**

- `DeFi`, `InfoFi`, `DeSci`, `Infra`, `Gaming`, `Social`, `Governance`, `NFT`, `Identity`, `Storage`, `Science`

### Common Patterns

**Multi-author:**

```solidity
/**
 * @author Alice Developer
 * @custom:author-email alice@example.com
 * @author Bob Developer
 * @custom:author-email bob@example.com
 */
```

**With additional packages:**

```solidity
/**
 * @custom:additional-pkg @openzeppelin/contracts@4.9.0, hardhat@2.19.0
 */
```

**Full example header:**

```solidity
/**
 * @title My FHEVM Contract
 * @notice Short description (max 300 chars).
 * @author Developer Name
 * @custom:author-email dev@example.com
 * @custom:author-url https://github.com/developer
 *
 * @dev Details:
 * Longer explanation of the contract purpose, functionality, and usage.
 * Can span multiple lines. Max 1000 characters total.
 *
 * @dev Usage summary:
 * - Step 1: Do something
 * - Step 2: Do another thing
 * - Step 3: Final step
 *
 * @custom:category fundamental
 * @custom:chapter basics
 * @custom:tags DeFi, Gaming
 * @custom:version 1.0.0
 * @custom:fhevm-version 0.5.0
 * @custom:ui false
 * @custom:additional-pkg @openzeppelin/contracts@4.9.0
 *
 * @dev Prerequisites:
 * - FHEVM environment
 * - Required dependencies
 *
 * @custom:security
 * - Security considerations here
 *
 * @custom:limitations
 * - Known limitations
 */
contract MyContract {
    // ...
}
```

---

## Error Handling & Troubleshooting

### Common Parsing Errors

#### Error: "Missing required tag: @title"

**Penyebab:** Contract tidak memiliki `@title` tag di level contract.

**Solusi:**

```solidity
/**
 * @title MyContract  // ✅ Add this
 * @notice Description
 * // ... other tags
 */
contract MyContract { }
```

#### Error: "Invalid category value"

**Penyebab:** Value `@custom:category` tidak sesuai dengan enum yang valid.

**Solusi:** Gunakan salah satu dari: `fundamental`, `patterns`, `applied`, `advanced`

```solidity
/**
 * @custom:category fundamental  // ✅ Valid
 * // NOT: @custom:category basic  ❌ Invalid
 */
```

#### Error: "Description exceeds 300 characters"

**Penyebab:** `@notice` terlalu panjang.

**Solusi:** Pindahkan deskripsi lengkap ke `@dev Details:`

```solidity
/**
 * @notice Short summary under 300 chars.  // ✅ For description
 *
 * @dev Details:  // ✅ For longer explanation
 * This is the longer, detailed explanation that can go up to 1000 characters.
 * Use this for comprehensive documentation.
 */
```

#### Error: "Contract name mismatch with filename"

**Penyebab:** Nama contract di code tidak match dengan nama file.

**Solusi:**

```
File: FHECounter.sol
Contract: contract FHECounter { }  // ✅ Must match (case-sensitive)

File: FHECounter.sol
Contract: contract FheCounter { }  // ❌ Case mismatch
```

#### Error: "Invalid email format"

**Penyebab:** Format email tidak valid di `@custom:author-email`.

**Solusi:**

```solidity
/**
 * @custom:author-email team@zama.ai         // ✅ Valid
 * @custom:author-email team at zama.ai      // ❌ Invalid
 * @custom:author-email team@zama            // ❌ No TLD
 */
```

#### Error: "No @author tag found"

**Penyebab:** Minimal 1 author diperlukan.

**Solusi:**

```solidity
/**
 * @author Your Name  // ✅ Required
 */
```

#### Error: "Invalid package format"

**Penyebab:** Format `@custom:additional-pkg` salah.

**Solusi:**

```solidity
/**
 * @custom:additional-pkg @openzeppelin/contracts@4.9.0  // ✅ Valid
 * @custom:additional-pkg @openzeppelin/contracts:4.9.0  // ❌ Use @ not :
 * @custom:additional-pkg @openzeppelin/contracts        // ❌ Missing version
 */
```

### Validation Checklist Before Generation

Sebelum menjalankan `starter:build`, pastikan:

1. **Required tags present:**
   - [ ] `@title`
   - [ ] `@notice`
   - [ ] `@author`
   - [ ] `@custom:category`
   - [ ] `@custom:chapter`
   - [ ] `@custom:ui`

2. **Character limits:**
   - [ ] `@notice` ≤ 300 chars
   - [ ] `@dev Details:` ≤ 1000 chars
   - [ ] `@title` between 1-100 chars
   - [ ] `@author` between 1-100 chars

3. **Valid enum values:**
   - [ ] `@custom:category` is one of: fundamental, patterns, applied, advanced
   - [ ] `@custom:chapter` is valid per schema
   - [ ] `@custom:ui` is `true` or `false`

4. **Format validation:**
   - [ ] Email (if present) is valid format
   - [ ] URL (if present) is valid URI
   - [ ] Package format is `name@version`
   - [ ] Contract name matches filename

5. **Code validation:**
   - [ ] Contract compiles without errors
   - [ ] All `FHE.*` calls are valid FHEVM operations
   - [ ] Constructor signature matches usage

### Manual Testing

Test metadata generation locally:

```bash
# Generate metadata from contract
npm run starter:build ./contracts/MyContract.sol -- --name my-contract

# Validate generated metadata.json
npm run check

# View generated metadata
cat starters/my-contract/metadata.json | jq
```

### Debug Mode

Run with verbose logging:

```bash
npm run starter:build ./contracts/MyContract.sol -- --verbose
```

This will show:

- Parsed tags and values
- Extracted FHE concepts
- Validation warnings
- Final metadata structure

---

## Tools & Validation

### Generate Schema

After updating Zod schemas, run:

```bash
npm run generate:schema
```

This updates JSON schemas di `lib/schemas/`.

### Validate Starter Metadata

Check starter compliance:

```bash
npm run check
```

This validates:

- metadata.json format
- required files exist
- anotasi standard (jika parsing diimplementasikan)

### Lint Code

```bash
npm run lint
```

Ini akan check NatSpec format dan consistency.

---

## Related Documentation

- [05_TESTING_GUIDELINES.md](05_TESTING_GUIDELINES.md) — Testing dan test anotasi guidelines
- [00_README.md](00_README.md) — Project overview
- [01_GET_STARTED.md](01_GET_STARTED.md) — Quick start guide
- [02_USING_STARTER_SCRIPT.md](02_USING_STARTER_SCRIPT.md) — Starter creation
- [03_AUTOMATION_SCRIPT.md](03_AUTOMATION_SCRIPT.md) — All CLI commands
- [../AGENTS.md](../AGENTS.md) — Development guidelines
