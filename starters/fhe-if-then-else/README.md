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


**Implementation:** Disimpan sebagai euint8 setelah diverifikasi melalui FHE.fromExternal.

### `_b`

```solidity
private euint8 _b;
```


**Implementation:** Disimpan sebagai euint8 setelah diverifikasi melalui FHE.fromExternal.

### `_max`

```solidity
private euint8 _max;
```


**Implementation:** Dihitung melalui computeMax() menggunakan kombinasi FHE.ge dan FHE.select.



## Functions

### `setA`

```solidity
external setA(externalEuint8 inputA, bytes calldata inputProof)
```

**Description:** Menyimpan operand A terenkripsi menggunakan proof yang diberikan.


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `inputA` | `` | Ciphertext eksternal bertipe euint8 yang dihasilkan off-chain. |
| `inputProof` | `` | Bukti input terenkripsi yang disertakan bersama ciphertext. |




### `setB`

```solidity
external setB(externalEuint8 inputB, bytes calldata inputProof)
```

**Description:** Menyimpan operand B terenkripsi menggunakan proof yang diberikan.


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `inputB` | `` | Ciphertext eksternal bertipe euint8 yang dihasilkan off-chain. |
| `inputProof` | `` | Bukti input terenkripsi yang disertakan bersama ciphertext. |




### `computeMax`

```solidity
external computeMax()
```

**Description:** Menghitung nilai maksimum terenkripsi antara A dan B dan memberikan izin dekripsi kepada pemanggil.

**Implementation Details:** Menggunakan FHE.ge untuk perbandingan dan FHE.select untuk memilih nilai terbesar sebelum izin diberikan.




### `result`

```solidity
public view result() returns (euint8)
```

**Description:** Mengembalikan nilai maksimum terenkripsi yang tersimpan.



**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `Encrypted` | `` | nilai maksimum antara operand A dan B. |








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
