# fhe-if-then-else

Demonstrates selecting the maximum encrypted uint8 value using FHE comparisons.


---

## Contract Information

| Property | Value |
|----------|-------|
| **Contract Name** | `FHEIfThenElse` |
| **File** | `contracts/FHEIfThenElse.sol` |
| **Category** | fundamental |
| **Chapter** | basics |
| **Version** | 1.0.0 |
| **FHEVM Version** | 0.9.1 |
| **UI Included** | ❌ No |

## FHE Concepts

This contract demonstrates the following FHE concepts:

- **FHE.ge** — Homomorphic operation on encrypted data
- **FHE.select** — Homomorphic operation on encrypted data
- **FHE.fromExternal** — Homomorphic operation on encrypted data
- **FHE.allow** — Homomorphic operation on encrypted data
- **FHE.allowThis** — Homomorphic operation on encrypted data



## Authors

**Zama Team**





---


## State Variables

### `_a`

```solidity
private euint8 _a;
```


**Implementation:** Stored as euint8 after verification via FHE.fromExternal.

### `_b`

```solidity
private euint8 _b;
```


**Implementation:** Stored as euint8 after verification via FHE.fromExternal.

### `_max`

```solidity
private euint8 _max;
```


**Implementation:** Calculated via computeMax() using combination of FHE.ge and FHE.select.



## Functions

### `setA`

```solidity
external setA(externalEuint8 inputA, bytes calldata inputProof)
```

**Description:** Stores encrypted operand A using the provided proof.


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `inputA` | `` | External ciphertext of type euint8 generated off-chain. |
| `inputProof` | `` | Encrypted input proof included with the ciphertext. |




### `setB`

```solidity
external setB(externalEuint8 inputB, bytes calldata inputProof)
```

**Description:** Stores encrypted operand B using the provided proof.


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `inputB` | `` | External ciphertext of type euint8 generated off-chain. |
| `inputProof` | `` | Encrypted input proof included with the ciphertext. |




### `computeMax`

```solidity
external computeMax()
```

**Description:** Computes the encrypted maximum value between A and B and grants decryption permission to the caller.

**Implementation Details:** Uses FHE.ge for comparison and FHE.select to choose the largest value before permissions are granted.




### `result`

```solidity
public view result() returns (euint8)
```

**Description:** Returns the stored encrypted maximum value.



**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `Encrypted` | `` | maximum value between operand A and B. |








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
