# UnknownContract: Encrypted Addition Example

## Overview

**Example ID**: `fhe-add`
**Level**: `fundamental`

**Summary**

Demonstrates how to take two encrypted inputs (A and B), store them in encrypted state, compute their encrypted sum, and let a user decrypt the result.

### What you will learn

- How this example uses encrypted types in FHEVM.
- How to interact with the contract from the test setup.
- How to think about visibility and decrypt permissions.

## Contract

**Name**: `UnknownContract`

## Public API

### `setA`

**What it does**

Stores encrypted input A into the contract.

**FHE details**

- Operations: `fromExternal`
- Visibility: `per-user`

**Parameters**

- `inputA` encrypted input handle for A
- `inputProof` zk-proof verifying ciphertext validity

### `setB`

**What it does**

Stores encrypted input B into the contract.

**FHE details**

- Operations: `fromExternal`
- Visibility: `per-user`

**Parameters**

- `inputB` encrypted input handle for B
- `inputProof` zk-proof verifying ciphertext validity

### `computeAPlusB`

**What it does**

Computes the encrypted result of A + B.

**FHE details**

- Operations: `add`
- Visibility: `delegated-decrypt`

### `result`

**What it does**

Returns the encrypted result of A + B.

**How it works**

- Caller must have decrypt permissions.

**Returns**

- `euint8` ciphertext of A+B

## Tests

**Suite**: `FHEAdd`

### Scenarios

#### Scenario `happy-path`

encrypted addition workflow

Cases:

- `compute-a-plus-b`: a + b should succeed
