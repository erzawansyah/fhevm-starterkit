# EncryptMultipleValues Starter



---

## Contract Information

| Property | Value |
|----------|-------|
| **Contract Name** | `EncryptMultipleValues` |
| **File** | `contracts/EncryptMultipleValues.sol` |
| **Category** | fundamental |
| **Chapter** | basics |
| **Version** | 1.0.0 |
| **FHEVM Version** | 0.9.1 |
| **UI Included** | ❌ No |

## FHE Concepts

This contract demonstrates the following FHE concepts:

- **FHE.fromExternal** — Homomorphic operation on encrypted data
- **FHE.allow** — Homomorphic operation on encrypted data
- **FHE.allowThis** — Homomorphic operation on encrypted data



## Authors

**Unknown**





---


## State Variables

### `_value`

```solidity
private euint8 _value;
```

**Description:** Ciphertext already stored as internal `euint8`.








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
