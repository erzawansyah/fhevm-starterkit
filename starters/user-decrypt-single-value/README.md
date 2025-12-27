# user-decrypt-single-value

Demonstrates user decryption of a single encrypted uint32 using FHE permissions.


---

## Contract Information

| Property | Value |
|----------|-------|
| **Contract Name** | `UserDecryptSingleValue` |
| **File** | `contracts/UserDecryptSingleValue.sol` |
| **Category** | applied |
| **Chapter** | decryption |
| **Version** | 1.0.0 |
| **FHEVM Version** | 0.9.1 |
| **UI Included** | ❌ No |

## FHE Concepts

This contract demonstrates the following FHE concepts:

- **FHE.add** — Homomorphic operation on encrypted data
- **FHE.asEuint32** — Homomorphic operation on encrypted data
- **FHE.allow** — Homomorphic operation on encrypted data
- **FHE.allowThis** — Homomorphic operation on encrypted data



## Authors

**Zama Team**





---


## State Variables

### `_trivialEuint32`

```solidity
private euint32 _trivialEuint32;
```





## Functions

### `initializeUint32`

```solidity
external initializeUint32(uint32 value)
```

**Description:** Initializes `_trivialEuint32` with FHE as `(value + 1)` and grants user decryption permissions.


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `value` | `` | The clear uint32 input, transformed to encrypted with FHE.asEuint32. |




### `initializeUint32Wrong`

```solidity
external initializeUint32Wrong(uint32 value)
```

**Description:** Initializes `_trivialEuint32` with FHE as `(value + 1)` but forgets to grant `allowThis`, causing user decryption to fail.


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `value` | `` | The clear uint32 input. |




### `encryptedUint32`

```solidity
public view encryptedUint32() returns (euint32)
```

**Description:** Returns the encrypted uint32 result handle.



**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `euint32` | `` | The encrypted handle representing the latest `_trivialEuint32` value. |








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
