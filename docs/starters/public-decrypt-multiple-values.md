# public-decrypt-multiple-values

Demonstrates a public, permissionless 8-sided die roll using FHE.makePubliclyDecryptable.


---

## Contract Information

| Property | Value |
|----------|-------|
| **Contract Name** | `PublicDecryptMultipleValues` |
| **File** | `contracts/PublicDecryptMultipleValues.sol` |
| **Category** | patterns |
| **Chapter** | decryption |
| **Version** | 1.0.0 |
| **FHEVM Version** | 0.9.1 |
| **UI Included** | ❌ No |

## FHE Concepts

This contract demonstrates the following FHE concepts:

- **FHE.randEuint8** — Homomorphic operation on encrypted data
- **FHE.makePubliclyDecryptable** — Homomorphic operation on encrypted data



## Authors

**Zama Team**





---



## Functions

### `highestDieRoll`

```solidity
external highestDieRoll(address playerA, address playerB)
```

**Description:** Initiates a new highest die roll game, generates the result using FHE,


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `playerA` | `` | The address of the first player. |
| `playerB` | `` | The address of the second player. |




### `getGamesCount`

```solidity
public view getGamesCount() returns (uint256)
```

**Description:** Returns the number of games created so far.



**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `The` | `` | number of games created. |



### `getPlayerADieRoll`

```solidity
public view getPlayerADieRoll(uint256 gameId) returns (euint8)
```

**Description:** Returns the encrypted euint8 handle that stores the playerA die roll.


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `gameId` | `` | The ID of the game. |


**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `The` | `` | encrypted result (euint8 handle). |



### `getPlayerBDieRoll`

```solidity
public view getPlayerBDieRoll(uint256 gameId) returns (euint8)
```

**Description:** Returns the encrypted euint8 handle that stores the playerB die roll.


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `gameId` | `` | The ID of the game. |


**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `The` | `` | encrypted result (euint8 handle). |



### `getWinner`

```solidity
public view getWinner(uint256 gameId) returns (address)
```

**Description:** Returns the address of the game winner. If the game is finalized, the function returns `address(0)`


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `gameId` | `` | The ID of the game. |


**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `The` | `` | winner's address (address(0) if not yet revealed or draw). |



### `isGameRevealed`

```solidity
public view isGameRevealed(uint256 gameId) returns (bool)
```

**Description:** Returns `true` if the game result is publicly revealed, `false` otherwise.


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `gameId` | `` | The ID of the game. |


**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `true` | `` | if the game is publicly revealed. |



### `recordAndVerifyWinner`

```solidity
public recordAndVerifyWinner(
        uint256 gameId,
        bytes memory abiEncodedClearGameResult,
        bytes memory decryptionProof
    )
```

**Description:** Verifies the provided (decryption proof, ABI-encoded clear values) pair against the stored ciphertext,


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `gameId` | `` | The ID of the game to settle. |
| `abiEncodedClearGameResult` | `` | The ABI-encoded clear values (uint8, uint8) associated to the `decryptionProof`. |
| `decryptionProof` | `` | The proof that validates the decryption. |






## Data Structures

### `Game`

Defines the entire state for a single die roll game instance.


**Fields:**

| Name | Type | Description |
|------|------|-------------|
| `playerA` | `address` | The address of player A for this game instance. |
| `playerB` | `address` | The address of player B for this game instance. |
| `playerAEncryptedDieRoll` | `euint8` | Publicly decryptable encrypted die rolls for each player. |
| `playerBEncryptedDieRoll` | `euint8` | — |
| `winner` | `address` | Clear address of the final winner, address(0) if draw, set after decryption and verification. |
| `revealed` | `bool` | Flag tracking whether the game result has been revealed. |


```solidity
struct Game {
    address playerA;
    address playerB;
    euint8 playerAEncryptedDieRoll;
    euint8 playerBEncryptedDieRoll;
    address winner;
    bool revealed;
}
```




## Events

### `GameCreated`



```solidity
GameCreated(
        uint256 indexed gameId,
        address indexed playerA,
        address indexed playerB,
        euint8 playerAEncryptedDieRoll,
        euint8 playerBEncryptedDieRoll
    )
```

**Parameters:**

| Name | Type | Indexed | Description |
|------|------|---------|-------------|
| `indexed` | `uint256` | — | — |
| `indexed` | `address` | — | — |
| `indexed` | `address` | — | — |
| `playerAEncryptedDieRoll` | `euint8` | — | — |
| `playerBEncryptedDieRoll` | `euint8` | — | — |




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
