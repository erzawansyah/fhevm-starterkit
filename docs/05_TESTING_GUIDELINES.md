# Testing Guidelines untuk FHEVM Contracts

## Merancang & Membangun Test Suite dari Contract Design

Dokumen ini menjelaskan **strategi testing** dan **metodologi** untuk membuat test suite yang comprehensive dari struktur contract Solidity. Fokus pada bagaimana **menganalisis contract** dan **merancang test structure** yang sesuai.

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Contract Analysis untuk Testing](#contract-analysis-untuk-testing)
3. [Test Structure Planning](#test-structure-planning)
4. [Testing Patterns untuk FHE Contracts](#testing-patterns-untuk-fhe-contracts)
5. [Test Design Workflow](#test-design-workflow)
6. [Contract → Test File Mapping](#contract--test-file-mapping)
7. [Fixture Strategy](#fixture-strategy)
8. [Coverage Requirements](#coverage-requirements)
9. [Complete Example: FHEAdd](#complete-example-fheadd)
10. [Testing Checklist](#testing-checklist)
11. [Related Documentation](#related-documentation)

---

## Testing Philosophy

### Core Principles

1. **Contract-Driven Testing** - Test structure berasal langsung dari **design contract**
2. **Behavior-Focused** - Test menjelaskan **apa yang contract lakukan**, bukan implementasi detail
3. **Living Documentation** - Setiap test case adalah dokumentasi usage contract
4. **One Test File Per Contract** - File `<ContractName>.ts` untuk `<ContractName>.sol`
5. **Comprehensive Coverage** - Minimal: happy path, edge cases, error cases, integration

### Testing Scope untuk FHEVM

Contract FHEVM biasanya memiliki 4 aspek testing:

1. **Input Handling** - Encrypted input acceptance, ZK proof validation
2. **Computation** - FHE operations, encrypted arithmetic correctness
3. **Permission & Access Control** - Who can call what, decryption authorization
4. **Decryption & Results** - Permission-based decryption, result correctness

---

## Contract Analysis untuk Testing

Sebelum menulis test, **analisis contract** untuk identify testing requirements.

### Step 1: Identify Contract Components

Baca contract Solidity dan catat:

| Component                     | Testing Questions                                                 |
| ----------------------------- | ----------------------------------------------------------------- |
| **State Variables**           | Apa initial values? Apa constraints? Siapa yang bisa modify?      |
| **Constructor**               | Apa yang di-initialize? Apa side effects?                         |
| **Public/External Functions** | Siapa yang bisa call? Apa preconditions? Apa postconditions?      |
| **Events**                    | Kapan emitted? Apa arguments?                                     |
| **Modifiers**                 | Apa yang di-enforce? Apa yang harus di-test?                      |
| **Encrypted Operations**      | Apa FHE operations? Apa proof requirements? Apa permission model? |

### Step 2: Map Contract Behavior

Untuk setiap **public function**, identify:

1. **Happy Path** - Normal usage, expected outcome
2. **Preconditions** - State/permissions required before call
3. **Postconditions** - State changes after call
4. **Error Cases** - Invalid inputs, permission denial, etc.
5. **Edge Cases** - Boundary values, overflow, empty inputs

### Example: FHEAdd Contract Analysis

```solidity
// contracts/FHEAdd.sol
contract FHEAdd {
  euint8 a;          // Encrypted input A
  euint8 b;          // Encrypted input B
  euint8 result;     // Encrypted result
  bool decryptionAllowed; // Permission flag

  function setA(bytes calldata _a, bytes calldata _proof) external { ... }
  function setB(bytes calldata _b, bytes calldata _proof) external { ... }
  function compute() external { ... }
  function grantPermission() external { ... }
  function decrypt() external view returns (uint8) { ... }
}
```

**Analysis hasil:**

| Function            | Happy Path                           | Preconditions                       | Postconditions                    | Error Cases                       |
| ------------------- | ------------------------------------ | ----------------------------------- | --------------------------------- | --------------------------------- |
| `setA()`            | Accept encrypted input + valid proof | Proof is valid format               | State var `a` updated, emit event | Invalid proof, malformed input    |
| `setB()`            | Accept encrypted input + valid proof | Proof is valid format               | State var `b` updated, emit event | Invalid proof, malformed input    |
| `compute()`         | Compute encrypted result (a + b)     | Both `a` and `b` must be set        | `result` updated                  | `a` or `b` not set                |
| `grantPermission()` | Allow decryption                     | Caller is owner                     | `decryptionAllowed = true`        | Caller is not owner               |
| `decrypt()`         | Return decrypted result              | Permission granted, caller is owner | -                                 | Permission not granted, not owner |

---

## Test Structure Planning

### Design Test Suite Layout

Dari contract analysis, **design describe blocks**:

```
FHEAdd (Main describe)
├── Input Handling (setA, setB behavior)
│   ├── should accept valid encrypted input
│   ├── should reject invalid proof
│   └── should emit event on success
├── Computation (compute behavior)
│   ├── should compute encrypted sum correctly
│   ├── should require both inputs set
│   └── should handle overflow
├── Permission & Access (grantPermission, decrypt behavior)
│   ├── should allow decryption with permission
│   ├── should deny decryption without permission
│   ├── should enforce owner-only access
│   └── should reject non-owner decryption
└── Complete Workflow (end-to-end)
    └── should execute full lifecycle: set → compute → grant → decrypt
```

### Naming Convention untuk Describe Blocks

Gunakan names yang **meaningful dan describe testing scope**:

| ✅ GOOD                   | ❌ AVOID         |
| ------------------------- | ---------------- |
| `Input Handling`          | `Tests`          |
| `Computation`             | `FHE Operations` |
| `Permission & Decryption` | `Decryption`     |
| `Complete Workflow`       | `All Tests`      |
| `Edge Cases: Overflow`    | `Edge`           |

---

## Testing Patterns untuk FHE Contracts

### Pattern 1: Input Validation (Encrypted Data)

**When:** Testing functions that accept encrypted inputs

**What:** Validate proof, format, state preconditions

```typescript
describe("Input Handling", () => {
  // Happy path
  it("should accept encrypted input with valid proof", async () => {
    const { fheAdd } = await deployFixture();
    const { encryptedA, proofA } = await generateValidInput();

    await expect(fheAdd.setA(encryptedA, proofA)).to.emit(fheAdd, "InputASet");
  });

  // Error case
  it("should reject invalid proof format", async () => {
    const { fheAdd } = await deployFixture();
    const invalidProof = "0x"; // Empty/invalid

    await expect(fheAdd.setA("0x123", invalidProof)).to.be.revertedWith(
      "Invalid proof"
    );
  });

  // Edge case
  it("should handle max encrypted value", async () => {
    const { fheAdd } = await deployFixture();
    const maxValue = await generateEncrypted(255); // max uint8
    const proof = await generateProof(maxValue);

    await expect(fheAdd.setA(maxValue, proof)).to.not.be.reverted;
  });
});
```

### Pattern 2: Computation & FHE Operations

**When:** Testing encrypted arithmetic or FHE operations

**What:** Validate computation correctness, intermediate states, result properties

```typescript
describe("Computation", () => {
  // Happy path
  it("should compute encrypted sum correctly", async () => {
    const { fheAdd } = await deployFixture();

    // Setup: set inputs
    await fheAdd.setA(encryptedA, proofA); // A = 5
    await fheAdd.setB(encryptedB, proofB); // B = 3

    // Action: compute
    await fheAdd.compute();

    // Verify: decrypt and check
    await fheAdd.grantPermission();
    const result = await fheAdd.decrypt();
    expect(result).to.equal(8); // 5 + 3 = 8
  });

  // Precondition check
  it("should require both inputs before compute", async () => {
    const { fheAdd } = await deployFixture();

    // Only set A, not B
    await fheAdd.setA(encryptedA, proofA);

    await expect(fheAdd.compute()).to.be.revertedWith("Both inputs required");
  });

  // Edge case: boundary
  it("should handle uint8 overflow (wrapping)", async () => {
    const { fheAdd } = await deployFixture();

    // Setup: A = 255 (max), B = 5
    await fheAdd.setA(await generateEncrypted(255), proofMax);
    await fheAdd.setB(await generateEncrypted(5), proofSmall);

    // Action: compute
    await fheAdd.compute();

    // Verify: result wraps (255 + 5) % 256 = 4
    await fheAdd.grantPermission();
    const result = await fheAdd.decrypt();
    expect(result).to.equal(4); // Wrapped value
  });
});
```

### Pattern 3: Permission & Access Control

**When:** Testing authorization, permission grants, access restrictions

**What:** Validate who can call what, permission requirements, access denials

```typescript
describe("Permission & Decryption", () => {
  // Happy path
  it("should allow decryption after permission grant", async () => {
    const { fheAdd, owner } = await deployFixture();

    // Setup: compute result
    await fheAdd.setA(encryptedA, proofA);
    await fheAdd.setB(encryptedB, proofB);
    await fheAdd.compute();

    // Grant permission
    await fheAdd.grantPermission();

    // Should allow decrypt
    await expect(fheAdd.decrypt()).to.not.be.reverted;
  });

  // Error case: missing permission
  it("should deny decryption without permission", async () => {
    const { fheAdd } = await deployFixture();

    // Setup: compute but DON'T grant permission
    await fheAdd.setA(encryptedA, proofA);
    await fheAdd.setB(encryptedB, proofB);
    await fheAdd.compute();

    // Should deny decrypt
    await expect(fheAdd.decrypt()).to.be.revertedWith("Not authorized");
  });

  // Access control
  it("should enforce owner-only decryption", async () => {
    const { fheAdd, owner, other } = await deployFixture();

    // Owner grants permission but...
    await fheAdd.grantPermission();

    // Non-owner tries to decrypt
    await expect(fheAdd.connect(other).decrypt()).to.be.revertedWith(
      "Only owner"
    );
  });
});
```

### Pattern 4: Integration & Full Workflow

**When:** Testing complete end-to-end scenarios

**What:** Validate entire sequence: setup → action → verification

```typescript
describe("Complete Workflow", () => {
  it("should execute full encryption-computation-decryption cycle", async () => {
    const { fheAdd } = await deployFixture();

    // Step 1: Set encrypted inputs
    await fheAdd.setA(encryptedA, proofA);
    await fheAdd.setB(encryptedB, proofB);

    // Step 2: Compute encrypted result
    await fheAdd.compute();

    // Step 3: Grant decryption permission
    await fheAdd.grantPermission();

    // Step 4: Decrypt and verify result
    const result = await fheAdd.decrypt();
    expect(result).to.equal(8); // 5 + 3
  });
});
```

---

## Test Design Workflow

Urutan praktis membuat test suite dari contract:

### 1. **Analyze Contract** (15 min)

- Read contract Solidity code
- Identify all public/external functions
- List state variables and their purposes
- Understand FHE operations and permission model

### 2. **Create Test Structure** (10 min)

- Create describe blocks berdasarkan function groups
- Name setiap describe block dengan jelas
- Plan 3-4 test cases per describe block

### 3. **Write Happy Path Tests** (20 min)

- Untuk setiap function, write normal usage test
- Ensure setup (fixtures) provides valid data
- Test successful execution dan expected results

### 4. **Add Precondition Tests** (15 min)

- Test yang violate preconditions should fail
- E.g., compute() before setA() should revert

### 5. **Add Error Case Tests** (20 min)

- Invalid inputs (malformed proof, wrong types)
- Permission denials (non-owner calls owner-only)
- State violations (calling in wrong order)

### 6. **Add Edge Case Tests** (15 min)

- Boundary values (min/max uint8, 0, 255)
- Overflow behavior (255 + 1 wrapping)
- Special states (empty lists, zero addresses)

### 7. **Write Integration Tests** (10 min)

- Full end-to-end workflow
- Multiple functions in sequence
- Verify final state correctness

---

## Contract → Test File Mapping

### Step-by-Step Example: FHEAdd

**Contract Structure:**

```solidity
contract FHEAdd {
  // State
  euint8 a;
  euint8 b;
  euint8 result;
  bool decryptionAllowed;

  // Functions
  function setA(bytes calldata _a, bytes calldata _proof) external
  function setB(bytes calldata _b, bytes calldata _proof) external
  function compute() external
  function grantPermission() external
  function decrypt() external view returns (uint8)
}
```

**Test File Mapping:**

| Contract Element    | Test Suite              | Test Cases                                                         |
| ------------------- | ----------------------- | ------------------------------------------------------------------ |
| `setA()`, `setB()`  | Input Handling          | - valid proof<br/>- invalid proof<br/>- max value<br/>- emit event |
| `compute()`         | Computation             | - correct result<br/>- require both inputs<br/>- overflow handling |
| `grantPermission()` | Permission & Decryption | - permission grant<br/>- owner-only<br/>- grant emits event        |
| `decrypt()`         | Permission & Decryption | - with permission<br/>- without permission<br/>- non-owner denial  |
| Full lifecycle      | Complete Workflow       | - end-to-end cycle                                                 |

**Generated Test File:**

```typescript
describe("FHEAdd", () => {
  // Fixtures
  async function deployFixture() {
    /* ... */
  }

  // Suite 1: Input Handling
  describe("Input Handling", () => {
    it("should accept encrypted input A with valid proof");
    it("should accept encrypted input B with valid proof");
    it("should reject invalid proof");
    it("should handle max value");
  });

  // Suite 2: Computation
  describe("Computation", () => {
    it("should compute encrypted sum correctly");
    it("should require both inputs before compute");
    it("should handle uint8 overflow");
  });

  // Suite 3: Permission & Decryption
  describe("Permission & Decryption", () => {
    it("should allow decryption after permission");
    it("should deny decryption without permission");
    it("should enforce owner-only decryption");
  });

  // Suite 4: Complete Workflow
  describe("Complete Workflow", () => {
    it("should execute full encryption-computation-decryption cycle");
  });
});
```

---

## Fixture Strategy

Fixtures adalah **setup code** yang runs sebelum test. Design fixtures untuk:

1. **Reusability** - Digunakan across multiple tests
2. **Isolation** - Fresh state untuk setiap test
3. **Clarity** - Clear what data tersedia untuk test

### Basic Fixture Pattern

```typescript
async function deployFixture() {
  // 1. Deploy contract
  const [owner, other] = await ethers.getSigners();
  const FHEAdd = await ethers.getContractFactory("FHEAdd");
  const fheAdd = await FHEAdd.deploy(owner.address);

  // 2. Generate test data
  const encryptedA = await generateEncrypted(5);
  const encryptedB = await generateEncrypted(3);
  const proofA = await generateProof(encryptedA);
  const proofB = await generateProof(encryptedB);

  // 3. Return all test artifacts
  return { fheAdd, owner, other, encryptedA, encryptedB, proofA, proofB };
}
```

### Using Fixtures in Tests

```typescript
describe("FHEAdd", () => {
  async function deployFixture() {
    /* ... */
  }

  // Load fresh fixture before each test
  it("test 1", async () => {
    const { fheAdd, owner, encryptedA, proofA } = await deployFixture();
    // Use fresh contract instance
  });

  it("test 2", async () => {
    const { fheAdd } = await deployFixture();
    // Different fresh instance, doesn't affect test 1
  });
});
```

### Multiple Fixtures untuk Different Scenarios

Kadang perlu fixtures yang berbeda untuk test scenarios yang berbeda:

```typescript
// Basic fixture
async function deployFixture() {
  /* ... */
}

// Fixture dengan pre-set inputs
async function deployWithInputsFixture() {
  const { fheAdd, owner, encryptedA, encryptedB, proofA, proofB } =
    await deployFixture();

  // Pre-set inputs
  await fheAdd.setA(encryptedA, proofA);
  await fheAdd.setB(encryptedB, proofB);

  return { fheAdd, owner, encryptedA, encryptedB };
}

describe("FHEAdd", () => {
  it("test input handling", async () => {
    const { fheAdd } = await deployFixture();
    // Test from fresh state
  });

  it("test computation", async () => {
    const { fheAdd } = await deployWithInputsFixture();
    // Test with pre-set inputs
  });
});
```

---

## Coverage Requirements

Setiap test suite harus memenuhi coverage requirements:

### 1. Happy Path Coverage (70% prioritas)

**Target:** Setiap function dengan minimal 1 happy path test

```typescript
describe("Computation", () => {
  it("should compute encrypted sum correctly", async () => {
    // Happy path: normal execution
    const { fheAdd, encryptedA, encryptedB, proofA, proofB } =
      await deployFixture();

    await fheAdd.setA(encryptedA, proofA);
    await fheAdd.setB(encryptedB, proofB);
    await fheAdd.compute();

    // Verify success
    await fheAdd.grantPermission();
    const result = await fheAdd.decrypt();
    expect(result).to.equal(8);
  });
});
```

### 2. Error Case Coverage (20% prioritas)

**Target:** Test untuk setiap error condition

```typescript
describe("Input Validation", () => {
  it("should reject invalid proof", async () => {
    const { fheAdd } = await deployFixture();

    await expect(fheAdd.setA("0x123", "0x")).to.be.revertedWith(
      "Invalid proof"
    );
  });

  it("should reject zero address", async () => {
    const { fheAdd } = await deployFixture();

    await expect(fheAdd.setAuthorized(ethers.ZeroAddress)).to.be.revertedWith(
      "Cannot be zero"
    );
  });
});
```

### 3. Edge Case Coverage (10% prioritas)

**Target:** Boundary values, special conditions

```typescript
describe("Computation", () => {
  it("should handle max uint8 value", async () => {
    const { fheAdd } = await deployFixture();

    const maxValue = await generateEncrypted(255);
    const proof = await generateProof(maxValue);

    await expect(fheAdd.setA(maxValue, proof)).to.not.be.reverted;
  });

  it("should handle overflow wrapping", async () => {
    const { fheAdd } = await deployFixture();

    // 255 + 5 = 4 (wrapped)
    const max = await generateEncrypted(255);
    const small = await generateEncrypted(5);

    await fheAdd.setA(max, await generateProof(max));
    await fheAdd.setB(small, await generateProof(small));
    await fheAdd.compute();

    await fheAdd.grantPermission();
    const result = await fheAdd.decrypt();
    expect(result).to.equal(4);
  });
});
```

### Coverage Checklist

- [ ] Setiap public function punya minimal 1 test
- [ ] Setiap error condition punya test
- [ ] Setiap modifier enforcement punya test
- [ ] Setidaknya 1 end-to-end integration test
- [ ] Edge cases untuk encrypted operations
- [ ] Permission/authorization scenarios

---

## Complete Example: FHEAdd

Berikut **complete test file** dari contract analysis sampai final test code.

### Step 1: Contract (Reference)

```solidity
// contracts/FHEAdd.sol
pragma solidity ^0.8.24;

import "@fhevm/contracts/FHEVMLib.sol";

contract FHEAdd {
  euint8 a;
  euint8 b;
  euint8 result;
  address private owner;
  bool private decryptionAllowed;

  event InputASet(address indexed setter);
  event InputBSet(address indexed setter);
  event ComputeDone();
  event PermissionGranted();

  constructor(address _owner) {
    owner = _owner;
    decryptionAllowed = false;
  }

  function setA(bytes calldata _a, bytes calldata _proof) external {
    a = FHEVMLib.asEuint8(_a, _proof);
    emit InputASet(msg.sender);
  }

  function setB(bytes calldata _b, bytes calldata _proof) external {
    b = FHEVMLib.asEuint8(_b, _proof);
    emit InputBSet(msg.sender);
  }

  function compute() external {
    result = FHEVMLib.add(a, b);
    emit ComputeDone();
  }

  function grantPermission() external {
    require(msg.sender == owner, "Only owner");
    decryptionAllowed = true;
    emit PermissionGranted();
  }

  function decrypt() external view returns (uint8) {
    require(decryptionAllowed, "Not authorized");
    require(msg.sender == owner, "Only owner");
    return FHEVMLib.decrypt(result);
  }
}
```

### Step 2: Test Analysis

```
Contract: FHEAdd
├── setA(bytes, bytes) → InputASet event
├── setB(bytes, bytes) → InputBSet event
├── compute() → ComputeDone event, requires a&b set
├── grantPermission() → PermissionGranted event, owner-only
└── decrypt() → returns uint8, requires permission&owner

Test Scope:
├── Input Handling (setA, setB)
│   ├── Accept valid encrypted input
│   ├── Emit correct event
│   ├── Reject invalid proof
│   └── Handle edge values (max uint8)
├── Computation (compute)
│   ├── Compute correct encrypted sum
│   ├── Require both inputs
│   └── Handle overflow (uint8 wrapping)
├── Permission & Decryption (grantPermission, decrypt)
│   ├── Allow decrypt with permission
│   ├── Deny decrypt without permission
│   ├── Enforce owner-only access
│   └── Enforce owner-only permission
└── Complete Workflow
    └── Full: set → compute → grant → decrypt
```

### Step 3: Complete Test File

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("FHEAdd", () => {
  // Fixtures
  async function deployFixture() {
    const [owner, other] = await ethers.getSigners();
    const FHEAdd = await ethers.getContractFactory("FHEAdd");
    const fheAdd = await FHEAdd.deploy(owner.address);

    // Generate test encrypted values
    const encryptedA = FHEVMLib.asEuint8(5);
    const encryptedB = FHEVMLib.asEuint8(3);
    const proofA = await generateProof(encryptedA);
    const proofB = await generateProof(encryptedB);

    return {
      fheAdd,
      owner,
      other,
      encryptedA,
      encryptedB,
      proofA,
      proofB,
    };
  }

  // Test Suite 1: Input Handling
  describe("Input Handling", () => {
    it("should accept encrypted input A with valid proof", async () => {
      const { fheAdd, encryptedA, proofA } = await deployFixture();

      await expect(fheAdd.setA(encryptedA, proofA)).to.emit(
        fheAdd,
        "InputASet"
      );
    });

    it("should accept encrypted input B with valid proof", async () => {
      const { fheAdd, encryptedB, proofB } = await deployFixture();

      await expect(fheAdd.setB(encryptedB, proofB)).to.emit(
        fheAdd,
        "InputBSet"
      );
    });

    it("should reject invalid proof format", async () => {
      const { fheAdd } = await deployFixture();

      await expect(
        fheAdd.setA("0x123456", "0x") // Invalid proof
      ).to.be.revertedWith("Invalid proof");
    });

    it("should handle max encrypted value", async () => {
      const { fheAdd } = await deployFixture();
      const maxValue = FHEVMLib.asEuint8(255);
      const proof = await generateProof(maxValue);

      await expect(fheAdd.setA(maxValue, proof)).to.not.be.reverted;
    });
  });

  // Test Suite 2: Computation
  describe("Computation", () => {
    it("should compute encrypted sum correctly", async () => {
      const { fheAdd, encryptedA, encryptedB, proofA, proofB, owner } =
        await deployFixture();

      // Setup
      await fheAdd.setA(encryptedA, proofA);
      await fheAdd.setB(encryptedB, proofB);

      // Action
      await expect(fheAdd.compute()).to.emit(fheAdd, "ComputeDone");

      // Verify: grant permission and decrypt
      await fheAdd.grantPermission();
      const result = await fheAdd.decrypt();
      expect(result).to.equal(8); // 5 + 3
    });

    it("should require both inputs before compute", async () => {
      const { fheAdd, encryptedA, proofA } = await deployFixture();

      // Only set A, not B
      await fheAdd.setA(encryptedA, proofA);

      // compute() should fail
      await expect(fheAdd.compute()).to.be.reverted;
    });

    it("should handle uint8 overflow correctly", async () => {
      const { fheAdd } = await deployFixture();

      // Setup: A=255 (max), B=5
      const maxValue = FHEVMLib.asEuint8(255);
      const smallValue = FHEVMLib.asEuint8(5);
      const proofMax = await generateProof(maxValue);
      const proofSmall = await generateProof(smallValue);

      await fheAdd.setA(maxValue, proofMax);
      await fheAdd.setB(smallValue, proofSmall);

      // Compute
      await fheAdd.compute();

      // Verify: result wraps (255 + 5) % 256 = 4
      await fheAdd.grantPermission();
      const result = await fheAdd.decrypt();
      expect(result).to.equal(4);
    });
  });

  // Test Suite 3: Permission & Decryption
  describe("Permission & Decryption", () => {
    it("should allow decryption after permission grant", async () => {
      const { fheAdd, encryptedA, encryptedB, proofA, proofB } =
        await deployFixture();

      // Setup and compute
      await fheAdd.setA(encryptedA, proofA);
      await fheAdd.setB(encryptedB, proofB);
      await fheAdd.compute();

      // Grant permission
      await expect(fheAdd.grantPermission()).to.emit(
        fheAdd,
        "PermissionGranted"
      );

      // Should allow decrypt
      await expect(fheAdd.decrypt()).to.not.be.reverted;
    });

    it("should deny decryption without permission", async () => {
      const { fheAdd, encryptedA, encryptedB, proofA, proofB } =
        await deployFixture();

      // Setup and compute, but NO permission
      await fheAdd.setA(encryptedA, proofA);
      await fheAdd.setB(encryptedB, proofB);
      await fheAdd.compute();

      // decrypt() should fail
      await expect(fheAdd.decrypt()).to.be.revertedWith("Not authorized");
    });

    it("should enforce owner-only permission grant", async () => {
      const { fheAdd, other } = await deployFixture();

      // Non-owner tries to grant permission
      await expect(fheAdd.connect(other).grantPermission()).to.be.revertedWith(
        "Only owner"
      );
    });

    it("should enforce owner-only decryption", async () => {
      const { fheAdd, other, encryptedA, encryptedB, proofA, proofB } =
        await deployFixture();

      // Setup and grant (as owner)
      await fheAdd.setA(encryptedA, proofA);
      await fheAdd.setB(encryptedB, proofB);
      await fheAdd.compute();
      await fheAdd.grantPermission();

      // Non-owner tries to decrypt
      await expect(fheAdd.connect(other).decrypt()).to.be.revertedWith(
        "Only owner"
      );
    });
  });

  // Test Suite 4: Complete Workflow
  describe("Complete Workflow", () => {
    it("should execute full encryption-computation-decryption cycle", async () => {
      const { fheAdd, encryptedA, encryptedB, proofA, proofB } =
        await deployFixture();

      // Step 1: Set encrypted inputs
      await fheAdd.setA(encryptedA, proofA);
      await fheAdd.setB(encryptedB, proofB);

      // Step 2: Compute encrypted result
      await fheAdd.compute();

      // Step 3: Grant decryption permission
      await fheAdd.grantPermission();

      // Step 4: Decrypt and verify
      const result = await fheAdd.decrypt();
      expect(result).to.equal(8); // 5 + 3 = 8
    });
  });
});
```

---

## Testing Checklist

### Pre-Writing Phase

- [ ] Contract analysis complete (functions, events, modifiers identified)
- [ ] Test structure planned (describe blocks organized)
- [ ] Coverage goals defined (happy path, error, edge cases)
- [ ] Fixture strategy designed (what data needed for tests)

### Writing Phase

- [ ] All public/external functions have tests
- [ ] Each describe block focuses on one aspect
- [ ] Each test has descriptive name (`should...` format)
- [ ] Tests follow setup-action-assert pattern
- [ ] Fixtures are reusable and isolated

### Verification Phase

- [ ] All tests pass (`npm test`)
- [ ] Coverage requirements met:
  - [ ] Happy path: ~1 test per function
  - [ ] Error cases: ~1 per error condition
  - [ ] Edge cases: boundary values tested
  - [ ] Integration: ~1 end-to-end test
- [ ] No skipped tests (`it.skip`)
- [ ] Events are tested where applicable
- [ ] Access control is tested (owner-only, etc.)
- [ ] Encrypted operations are verified (decrypt results)
- [ ] Overflow/wrapping is tested where applicable

### Code Quality

- [ ] Code follows TypeScript conventions (double quotes, semicolons)
- [ ] No unused variables or imports
- [ ] Meaningful variable names
- [ ] Comments explain complex logic or non-obvious test setup

---

## Related Documentation

- [04_COMMENTING_GUIDELINES.md](04_COMMENTING_GUIDELINES.md) — Contract anotasi guidelines
- [00_README.md](00_README.md) — Project overview
- [01_GET_STARTED.md](01_GET_STARTED.md) — Quick start guide
- [02_USING_STARTER_SCRIPT.md](02_USING_STARTER_SCRIPT.md) — Starter creation
- [03_AUTOMATION_SCRIPT.md](03_AUTOMATION_SCRIPT.md) — All CLI commands
- [../AGENTS.md](../AGENTS.md) — Development guidelines
