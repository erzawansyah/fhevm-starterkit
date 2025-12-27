# public-decrypt-single-value

Demonstrates public, permissionless decryption of a single encrypted boolean using FHE.makePubliclyDecryptable.


---

## Contract Information

| Property | Value |
|----------|-------|
| **Contract Name** | `PublicDecryptSingleValue` |
| **File** | `contracts/PublicDecryptSingleValue.sol` |
| **Category** | applied |
| **Chapter** | decryption |
| **Version** | 1.0.0 |
| **FHEVM Version** | 0.9.1 |
| **UI Included** | ❌ No |

## FHE Concepts

This contract demonstrates the following FHE concepts:

- **FHE.randEbool** — Homomorphic operation on encrypted data
- **FHE.makePubliclyDecryptable** — Homomorphic operation on encrypted data



## Authors

**Zama Team**





---



## Functions

### `headsOrTails`

```solidity
external headsOrTails(address headsPlayer, address tailsPlayer)
```

**Description:** Initiates a new Heads or Tails game, generates the result using FHE,


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `headsPlayer` | `` | The player address choosing Heads. |
| `tailsPlayer` | `` | The player address choosing Tails. |




### `getGamesCount`

```solidity
public view getGamesCount() returns (uint256)
```

**Description:** Returns the number of games created so far.



**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `The` | `` | number of games created. |



### `hasHeadsWon`

```solidity
public view hasHeadsWon(uint256 gameId) returns (ebool)
```

**Description:** Returns the encrypted ebool handle that stores the game result.


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `gameId` | `` | The ID of the game. |


**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `The` | `` | encrypted result (ebool handle). |



### `getWinner`

```solidity
public view getWinner(uint256 gameId) returns (address)
```

**Description:** Returns the address of the game winner.


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `gameId` | `` | The ID of the game. |


**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `The` | `` | winner's address (address(0) if not yet revealed). |



### `recordAndVerifyWinner`

```solidity
public recordAndVerifyWinner(
        uint256 gameId,
        bytes memory abiEncodedClearGameResult,
        bytes memory decryptionProof
    )
```

**Description:** Verifies the provided (decryption proof, ABI-encoded clear value) pair against the stored ciphertext,


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `gameId` | `` | The ID of the game to settle. |
| `abiEncodedClearGameResult` | `` | The ABI-encoded clear value (bool) associated to the `decryptionProof`. |
| `decryptionProof` | `` | The proof that validates the decryption. |






## Data Structures

### `Game`

Defines the entire state for a single Heads or Tails game instance.


**Fields:**

| Name | Type | Description |
|------|------|-------------|
| `headsPlayer` | `address` | The address of the player who chose Heads. |
| `tailsPlayer` | `address` | The address of the player who chose Tails. |
| `won` | `Heads` | — |
| `encryptedHasHeadsWon` | `ebool` | — |
| `winner` | `address` | Clear address of the final winner, set after decryption and verification. |


```solidity
struct Game {
    address headsPlayer;
    address tailsPlayer;
    Heads won;
    ebool encryptedHasHeadsWon;
    address winner;
}
```




## Events

### `GameCreated`



```solidity
GameCreated(
        uint256 indexed gameId,
        address indexed headsPlayer,
        address indexed tailsPlayer,
        ebool encryptedHasHeadsWon
    )
```

**Parameters:**

| Name | Type | Indexed | Description |
|------|------|---------|-------------|
| `indexed` | `uint256` | — | — |
| `indexed` | `address` | — | — |
| `indexed` | `address` | — | — |
| `encryptedHasHeadsWon` | `ebool` | — | — |




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
