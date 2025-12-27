# user-decrypt-multiple-values

Demonstrates user decryption of multiple encrypted values (bool, uint32, uint64) using FHE permissions.


---

## Contract Information

| Property | Value |
|----------|-------|
| **Contract Name** | `UserDecryptMultipleValues` |
| **File** | `contracts/UserDecryptMultipleValues.sol` |
| **Category** | applied |
| **Chapter** | decryption |
| **Version** | 1.0.0 |
| **FHEVM Version** | 0.9.1 |
| **UI Included** | ❌ No |

## FHE Concepts

This contract demonstrates the following FHE concepts:

- **FHE.add** — Homomorphic operation on encrypted data
- **FHE.xor** — Homomorphic operation on encrypted data
- **FHE.asEbool** — Homomorphic operation on encrypted data
- **FHE.asEuint32** — Homomorphic operation on encrypted data
- **FHE.asEuint64** — Homomorphic operation on encrypted data
- **FHE.allow** — Homomorphic operation on encrypted data
- **FHE.allowThis** — Homomorphic operation on encrypted data



## Authors

**Zama Team**





---


## State Variables

### `_encryptedBool`

```solidity
private ebool _encryptedBool;
```



### `_encryptedUint32`

```solidity
private euint32 _encryptedUint32;
```



### `_encryptedUint64`

```solidity
private euint64 _encryptedUint64;
```





## Functions

### `initialize`

```solidity
external initialize(bool a, uint32 b, uint64 c)
```

**Description:** Initializes the encrypted state using trivial formulas and grants permissions.


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `a` | `` | Clear boolean input; stored as `a ^ false`. |
| `b` | `` | Clear uint32 input; stored as `b + 1` (mod 2^32). |
| `c` | `` | Clear uint64 input; stored as `c + 1` (mod 2^64). |




### `encryptedBool`

```solidity
public view encryptedBool() returns (ebool)
```

**Description:** Returns the encrypted boolean handle.



**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `ebool` | `` | The encrypted handle. |



### `encryptedUint32`

```solidity
public view encryptedUint32() returns (euint32)
```

**Description:** Returns the encrypted uint32 handle.



**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `euint32` | `` | The encrypted handle. |



### `encryptedUint64`

```solidity
public view encryptedUint64() returns (euint64)
```

**Description:** Returns the encrypted uint64 handle.



**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `euint64` | `` | The encrypted handle. |








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
