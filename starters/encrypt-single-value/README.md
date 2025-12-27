# encrypt-single-value

Demonstrates receiving a single encrypted uint32 via FHE.fromExternal with proof-bound inputs.


---

## Contract Information

| Property | Value |
|----------|-------|
| **Contract Name** | `EncryptSingleValue` |
| **File** | `contracts/EncryptSingleValue.sol` |
| **Category** | applied |
| **Chapter** | encryption |
| **Version** | 1.0.0 |
| **FHEVM Version** | 0.9.1 |
| **UI Included** | ❌ No |

## FHE Concepts

This contract demonstrates the following FHE concepts:

- **FHE.fromExternal** — Homomorphic operation on encrypted data
- **FHE.allow** — Homomorphic operation on encrypted data
- **FHE.allowThis** — Homomorphic operation on encrypted data



## Authors

**Zama Team**





---


## State Variables

### `_encryptedEuint32`

```solidity
private euint32 _encryptedEuint32;
```





## Functions

### `initialize`

```solidity
external initialize(externalEuint32 inputEuint32, bytes calldata inputProof)
```

**Description:** Stores the encrypted uint32 after verifying the external proof binding.


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `inputEuint32` | `` | The external encrypted uint32 handle produced off-chain. |
| `inputProof` | `` | The proof binding the handle to (contractAddress, sender). |




### `encryptedUint32`

```solidity
public view encryptedUint32() returns (euint32)
```

**Description:** Returns the encrypted uint32 handle.



**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `euint32` | `` | The encrypted handle. |








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
