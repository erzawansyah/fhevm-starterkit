# fhevm-anti-patterns-playground

Single-contract collection of common FHEVM mistakes and their correct alternatives.

## Overview
This educational contract aggregates frequent pitfalls when working with FHEVM handles, permissions,
and encrypted computations, alongside the correct patterns. Some functions are intentionally unsafe
and may revert to illustrate the failure modes.
@dev Usage summary:
- Call `initialize()` once to set zero handles and grant caller permissions.
- Use `setCorrectly()` then `useCorrectValue()` to see the correct lifecycle.
- Call `setIncorrectly()` then `useIncorrectValue()` to observe a typical revert when `allowThis()` is missing.
- Compare `setValueCorrect()` vs `setValueWrongUser()` to understand decrypt permissions.
- Compare `computeValueCorrect()` vs `computeValueWrong()` to understand result permissions.
@custom:category patterns
@custom:chapter anti-patterns
@custom:tags Handles,Permissions,Education
@custom:ui false

---

## Contract Information

| Property | Value |
|----------|-------|
| **Contract Name** | `FHEVMAntiPatterns` |
| **File** | `contracts/AntiPatterns.sol` |
| **Category** | patterns |
| **Chapter** | anti-patterns |
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
- `Permissions`
- `Education`


## Authors

**Zama Team**





---


## State Variables

### `_value`

```solidity
private euint32 _value;
```



### `_result`

```solidity
private euint32 _result;
```



### `_unusableVal`

```solidity
private euint32 _unusableVal;
```



### `_initialized`

```solidity
private bool _initialized;
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


---

*This documentation was auto-generated from contract metadata and NatSpec comments.*
