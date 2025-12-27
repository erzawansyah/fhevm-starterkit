# InputProofExample Starter



---

## Contract Information

| Property | Value |
|----------|-------|
| **Contract Name** | `InputProofExample` |
| **File** | `contracts/InputProofExplanation.sol` |
| **Category** | fundamental |
| **Chapter** | basics |
| **Version** | 1.0.0 |
| **FHEVM Version** | 0.9.1 |
| **UI Included** | ❌ No |

## FHE Concepts

This contract demonstrates the following FHE concepts:

- **FHE.add** — Homomorphic operation on encrypted data
- **FHE.sub** — Homomorphic operation on encrypted data
- **FHE.mul** — Homomorphic operation on encrypted data
- **FHE.eq** — Homomorphic operation on encrypted data
- **FHE.lt** — Homomorphic operation on encrypted data
- **FHE.select** — Homomorphic operation on encrypted data
- **FHE.fromExternal** — Homomorphic operation on encrypted data
- **FHE.asEuint32** — Homomorphic operation on encrypted data
- **FHE.allow** — Homomorphic operation on encrypted data
- **FHE.allowThis** — Homomorphic operation on encrypted data



## Authors

**Unknown**





---


## State Variables

### `_validationCount`

```solidity
private uint256 _validationCount;
```

**Description:** Counter for tracking proof validations (for audit/demo purposes)







## Events

### `ValueSet`



```solidity
ValueSet(address indexed user, uint256 timestamp)
```

**Parameters:**

| Name | Type | Indexed | Description |
|------|------|---------|-------------|
| `indexed` | `address` | — | — |
| `timestamp` | `uint256` | — | — |


### `ValueRetrieved`



```solidity
ValueRetrieved(address indexed user, uint256 timestamp)
```

**Parameters:**

| Name | Type | Indexed | Description |
|------|------|---------|-------------|
| `indexed` | `address` | — | — |
| `timestamp` | `uint256` | — | — |


### `ProofValidated`



```solidity
ProofValidated(address indexed user, uint256 validationCount)
```

**Parameters:**

| Name | Type | Indexed | Description |
|------|------|---------|-------------|
| `indexed` | `address` | — | — |
| `validationCount` | `uint256` | — | — |




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
