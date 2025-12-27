# Guideline Anotasi Kontrak dan File Test

## Untuk Auto-Generate Dokumentasi FHEVM StarterKit

Dokumen ini menjelaskan standar **anotasi dan komentar** yang **WAJIB** dan **OPSIONAL** digunakan pada kontrak Solidity dan file test agar dokumentasi dapat di-generate otomatis, konsisten, dan edukatif.

**Tujuan guideline ini:**

- Mendukung automation dan parsing dokumentasi
- Menjaga kualitas starter sebagai materi pembelajaran
- Konsisten dengan constraint dan praktik sehat FHEVM

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

## Guideline Anotasi File Test

Komentar di test digunakan untuk **dokumentasi perilaku dan skenario**.

### Level File Test

#### WAJIB

- `@title` — Nama file test / contract yang di-test
- `@notice` — Deskripsi singkat test suite

```typescript
/**
 * @title FHEAdd Test Suite
 * @notice Tests encrypted addition behavior and edge cases.
 */
describe("FHEAdd", () => {
  // ...
});
```

#### OPSIONAL

- `@dev Scenarios:` — Daftar skenario pengujian utama

```typescript
/**
 * @title FHEAdd Test
 * @notice Tests encrypted addition behavior.
 * @dev Scenarios:
 * - Valid encrypted inputs produce correct sum
 * - Permission required for decryption
 * - Edge case: overflow handling (uint8)
 */
```

### Level Suite (`describe`)

#### OPSIONAL (Direkomendasikan)

- `@notice` — Tujuan suite

```typescript
describe("Encrypted Addition", () => {
  // @notice Tests basic addition operations
  describe("Basic Operations", () => {
    // ...
  });
});
```

### Level Case (`it` / `test`)

#### OPSIONAL

- `@notice` — Satu kalimat tentang apa yang di-validate

```typescript
it("should compute correct encrypted sum", () => {
  // @notice Validates that encrypted addition produces correct result
  // ...
});
```

### Contoh Test File Lengkap

```typescript
/**
 * @title FHEAdd Test Suite
 * @notice Tests encrypted addition operations and permissions.
 * @dev Scenarios:
 * - Valid encrypted inputs
 * - Permission grant and revoke
 * - Decryption validation
 * - Edge cases (uint8 overflow)
 */
describe("FHEAdd", () => {
  async function deployFixture() {
    // Deploy and return contract instance
    return fheAdd;
  }

  describe("Encryption", () => {
    it("should accept encrypted inputs", async () => {
      // @notice Validates setA accepts encrypted input with proof
      const { fheAdd } = await deployFixture();
      // ...
    });
  });

  describe("Computation", () => {
    it("should compute encrypted sum", async () => {
      // @notice Validates compute() returns valid encrypted result
      // ...
    });
  });

  describe("Decryption", () => {
    it("should decrypt with permission", async () => {
      // @notice Validates decrypt works after grantPermission
      // ...
    });
  });
});
```

---

## Minimal Compliance Checklist

Untuk starter dianggap **valid** (siap untuk auto-doc dan publication):

### Contract Level

- [ ] Punya `@title`
- [ ] Punya `@notice`
- [ ] Punya `@dev Usage summary:` dengan minimal 1 bullet point
- [ ] Semua state variable encrypted punya `@notice`

### Function Level

- [ ] Semua fungsi public/external punya `@notice`
- [ ] Semua fungsi public/external punya `@param` untuk **setiap parameter**
- [ ] Constructor (jika ada) punya `@notice` dan `@param`

### Test Level

- [ ] File test punya `@title` dan `@notice`
- [ ] Minimal satu test case (tidak boleh kosong)

### Contoh Valid Starter

**Contoh: `fhe-add/contracts/FHEAdd.sol`**

```solidity
/**
 * @title FHEAdd
 * @notice Demonstrates encrypted addition on uint8 values using FHE.
 * @dev Usage summary:
 * - Call setA() with encrypted uint8 input and proof
 * - Call setB() with encrypted uint8 input and proof
 * - Call compute() to calculate encrypted sum
 * - Call decrypt() to retrieve plaintext result (requires permission)
 */
contract FHEAdd {
    /// @notice Encrypted input A
    euint8 private encryptedA;

    /// @notice Encrypted input B
    euint8 private encryptedB;

    /// @notice Encrypted result (A + B)
    euint8 private encryptedSum;

    /**
     * @notice Sets encrypted input A.
     * @param input Encrypted uint8 value.
     * @param inputProof ZK proof for input.
     */
    function setA(bytes calldata input, bytes calldata inputProof) external {
        // ...
    }

    /**
     * @notice Computes encrypted sum.
     * @dev Internal operation, result stored in encryptedSum.
     */
    function compute() external {
        // ...
    }

    /**
     * @notice Decrypts and returns result.
     * @return Plain uint8 sum value.
     */
    function decrypt() external view returns (uint8) {
        // ...
    }
}
```

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

- [00_README.md](00_README.md) — Project overview
- [01_GET_STARTED.md](01_GET_STARTED.md) — Quick start guide
- [02_USING_STARTER_SCRIPT.md](02_USING_STARTER_SCRIPT.md) — Starter creation
- [03_AUTOMATION_SCRIPT.md](03_AUTOMATION_SCRIPT.md) — All CLI commands
- [../AGENTS.md](../AGENTS.md) — Development guidelines
