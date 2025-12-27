# encrypted-access-control

Demonstrates access control using encrypted roles and FHE permissions (allow vs allowTransient).


---

## Contract Information

| Property | Value |
|----------|-------|
| **Contract Name** | `EncryptedAccessControl` |
| **File** | `contracts/AccessControl.sol` |
| **Category** | fundamental |
| **Chapter** | basics |
| **Version** | 1.0.0 |
| **FHEVM Version** | 0.9.1 |
| **UI Included** | ❌ No |

## FHE Concepts

This contract demonstrates the following FHE concepts:

- **FHE.select** — Homomorphic operation on encrypted data
- **FHE.fromExternal** — Homomorphic operation on encrypted data
- **FHE.asEuint32** — Homomorphic operation on encrypted data
- **FHE.allow** — Homomorphic operation on encrypted data
- **FHE.allowThis** — Homomorphic operation on encrypted data
- **FHE.allowTransient** — Homomorphic operation on encrypted data



## Authors

**Unknown**





---

## Constructor

### Description
Initializes admin to deployer.




## State Variables

### `admin`

```solidity
public address admin;
```

**Description:** Admin address that can manage roles and secret.


### `_secret`

```solidity
private euint32 _secret;
```

**Description:** Encrypted secret stored in the contract.




## Functions

### `setEncryptedRole`

```solidity
external setEncryptedRole(address user, externalEbool role, bytes calldata inputProof)
```

**Description:** Initializes admin to deployer.


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `user` | `` | Address receiving the role. |
| `role` | `` | Encrypted boolean indicating access. |
| `inputProof` | `` | Zero-knowledge proof for `role`. |




### `allowThisRole`

```solidity
external allowThisRole(address user)
```

**Description:** Allows this contract to use the stored encrypted role for a given user.

**Implementation Details:** Useful if role ciphertext was migrated or if tooling wants an explicit "re-allowThis".

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `user` | `` | Address whose role ciphertext is re-allowed for this contract. |




### `setSecretValue`

```solidity
external setSecretValue(externalEuint32 value, bytes calldata inputProof)
```

**Description:** Sets the encrypted secret value stored in this contract.


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `value` | `` | Encrypted uint32 secret. |
| `inputProof` | `` | Zero-knowledge proof for `value`. |




### `allowThisSecret`

```solidity
external allowThisSecret()
```

**Description:** Re-allows the contract to use the stored secret ciphertext.

**Implementation Details:** Useful if secret ciphertext was migrated or tooling wants explicit allowThis.




### `readSecretTransient`

```solidity
external readSecretTransient() returns (euint32)
```

**Description:** Reads the secret with transient permission (recommended default).

**Implementation Details:** This demonstrates FHE.allowTransient:


**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `Encrypted` | `` | result (either secret or zero). |



### `grantPersistentSecretAccess`

```solidity
external grantPersistentSecretAccess(address user)
```

**Description:** Grants persistent decrypt permission for the secret to `user`.

**Implementation Details:** This demonstrates FHE.allow:

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `user` | `` | Address to grant persistent secret decrypt permission. |




### `revokePersistentSecretAccess`

```solidity
external revokePersistentSecretAccess(address user)
```

**Description:** Revokes persistent decrypt permission flag for the secret from `user`.

**Implementation Details:** Some FHE permission systems may not support true revocation for already-granted ciphertext.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `user` | `` | Address to revoke application-level access flag. |




### `readSecretPersistent`

```solidity
external readSecretPersistent() returns (euint32)
```

**Description:** Reads the secret for users with persistent access flag and encrypted role.

**Implementation Details:** This shows a common pattern:


**Returns:**

| Name | Type | Description |
|------|------|-------------|
| `Encrypted` | `` | result (either secret or zero). |



### `setAdmin`

```solidity
external setAdmin(address newAdmin)
```

**Description:** Transfers admin role to a new address.


**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `newAdmin` | `` | New admin address. |








## Events

### `EncryptedRoleSet`



```solidity
EncryptedRoleSet(address indexed user)
```

**Parameters:**

| Name | Type | Indexed | Description |
|------|------|---------|-------------|
| `indexed` | `address` | — | — |


### `SecretUpdated`



```solidity
SecretUpdated()
```


### `PersistentAccessGranted`



```solidity
PersistentAccessGranted(address indexed user)
```

**Parameters:**

| Name | Type | Indexed | Description |
|------|------|---------|-------------|
| `indexed` | `address` | — | — |


### `PersistentAccessRevoked`



```solidity
PersistentAccessRevoked(address indexed user)
```

**Parameters:**

| Name | Type | Indexed | Description |
|------|------|---------|-------------|
| `indexed` | `address` | — | — |




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
