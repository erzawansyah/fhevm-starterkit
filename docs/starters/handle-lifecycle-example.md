# handle-lifecycle-example

Demonstrates how FHE handles work under the hood.

## Overview
Handles are lightweight pointers to ciphertext inside the coprocessor, and `FHE.allowThis` keeps them usable.
@custom:category fundamental
@custom:chapter handles
@custom:tags Handles,Education
@custom:ui false

---

## Contract Information

| Property | Value |
|----------|-------|
| **Contract Name** | `HandleExample` |
| **File** | `contracts/HandlerExample.sol` |
| **Category** | fundamental |
| **Chapter** | handles |
| **Version** | 1.0.0 |
| **FHEVM Version** | 0.9.1 |
| **UI Included** | ❌ No |

## FHE Concepts

This contract demonstrates the following FHE concepts:

- **FHE.add** — Homomorphic operation on encrypted data
- **FHE.fromExternal** — Homomorphic operation on encrypted data
- **FHE.asEuint32** — Homomorphic operation on encrypted data
- **FHE.allow** — Homomorphic operation on encrypted data
- **FHE.allowThis** — Homomorphic operation on encrypted data


## Tags

- `Handles`
- `Education`


## Authors

**Zama Team**





---


## State Variables

### `_storedValue`

```solidity
private euint32 _storedValue;
```

**Description:** Encrypted placeholder for the tracked handle; zero handle is granted at deployment.








---

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Compile the contract:**
   ```bash
   npx hardhat compile
   ```

3. **Run tests:**
   ```bash
   npx hardhat test
   ```

4. **Deploy:**
   ```bash
   npx hardhat run scripts/deploy.ts --network <network-name>
   ```


---

*This documentation was auto-generated from contract metadata and NatSpec comments.*
