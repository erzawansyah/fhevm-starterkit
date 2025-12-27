# FHE Addition Example

Demonstrates encrypted addition on uint8 operands using FHE permissions.


---

## Contract Information

| Property | Value |
|----------|-------|
| **Contract Name** | `FHEAdd` |
| **File** | `contracts/FHEAdd.sol` |
| **Category** | fundamental |
| **Chapter** | fhe-operations |
| **Version** | 1.0.0 |
| **FHEVM Version** | 0.9.1 |
| **UI Included** | ✅ Yes |

## FHE Concepts

This contract demonstrates the following FHE concepts:

- **FHE.add** — Homomorphic operation on encrypted data
- **FHE.fromExternal** — Homomorphic operation on encrypted data
- **FHE.allow** — Homomorphic operation on encrypted data
- **FHE.allowThis** — Homomorphic operation on encrypted data


## Tags

- `arithmetic`
- `tutorial`


## Authors

**Zama Team**





---


## State Variables

### `_a`

```solidity
private euint8 _a;
```



### `_b`

```solidity
private euint8 _b;
```



### `_a_plus_b`

```solidity
private euint8 _a_plus_b;
```









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

## Frontend Integration

This starter includes a frontend UI for interacting with the contract. See the `ui/` directory for more information.


---

*This documentation was auto-generated from contract metadata and NatSpec comments.*
