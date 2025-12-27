# confidential-survey

Privacy-preserving survey system where all responses remain encrypted until survey closure.

## Overview
This contract implements a fully confidential survey system using Fully Homomorphic Encryption (FHE).
All survey responses are encrypted on-chain and can only be decrypted after survey closure.
The contract computes encrypted statistics in real-time without revealing individual responses.
@dev Key Features:
- Encrypted response submission with FHE operations
- Real-time encrypted statistical aggregation (mean, variance, min, max, frequency)
- Survey lifecycle management (Created → Active → Closed)
- Configurable respondent limits and question constraints
- Granular decryption permissions for owners and respondents
@dev Usage Flow:
1. Initialize survey with metadata and questions
2. Publish survey with max scores per question
3. Respondents submit encrypted responses
4. Survey auto-closes when limit reached or manually closed
5. Grant decrypt permissions to view aggregated statistics
@custom:category advanced
@custom:chapter encryption
@custom:tags Survey, Statistics, Privacy, Governance
@custom:ui true
@dev Constraints:
- Max 1000 respondents per survey (gas optimization)
- Max 15 questions per survey
- Max score 10 per question (1-10 range)
- Single response per address (no revisions)
@custom:security
- ReentrancyGuard protects submission flow
- Owner-only functions for survey management
- Encrypted statistics prevent data leakage
- Permission-based decryption model
@custom:since 0.1.0

---

## Contract Information

| Property | Value |
|----------|-------|
| **Contract Name** | `ConfidentialSurvey` |
| **File** | `contracts/ConfidentialSurvey.sol` |
| **Category** | advanced |
| **Chapter** | encryption |
| **Version** | 1.0.0 |
| **FHEVM Version** | 0.9.1 |
| **UI Included** | ✅ Yes |

## FHE Concepts

This contract demonstrates the following FHE concepts:

- **FHE.add** — Homomorphic operation on encrypted data
- **FHE.mul** — Homomorphic operation on encrypted data
- **FHE.eq** — Homomorphic operation on encrypted data
- **FHE.gt** — Homomorphic operation on encrypted data
- **FHE.lt** — Homomorphic operation on encrypted data
- **FHE.select** — Homomorphic operation on encrypted data
- **FHE.fromExternal** — Homomorphic operation on encrypted data
- **FHE.asEuint8** — Homomorphic operation on encrypted data
- **FHE.asEuint64** — Homomorphic operation on encrypted data
- **FHE.allow** — Homomorphic operation on encrypted data
- **FHE.allowThis** — Homomorphic operation on encrypted data


## Tags

- `Survey`
- `Statistics`
- `Privacy`
- `Governance`


## Authors

**M.E.W**

- Website: [https://github.com/erzawansyah](https://github.com/erzawansyah)



---


## State Variables

### `survey`

```solidity
public SurveyDetails survey;
```

**Description:** Complete survey configuration and metadata


### `totalRespondents`

```solidity
public uint256 totalRespondents;
```

**Description:** Current number of users who have submitted responses


### `respondents`

```solidity
public address[] respondents;
```


**Implementation:** Array of all respondent addresses for enumeration (limited to MAX_RESPONDENTS for gas efficiency)




## Data Structures

### `SurveyDetails`



**Fields:**

| Name | Type | Description |
|------|------|-------------|
| `owner` | `address` | — |
| `symbol` | `string` | — |
| `metadataCID` | `string` | — |
| `questionsCID` | `string` | — |
| `totalQuestions` | `uint256` | — |
| `respondentLimit` | `uint256` | — |
| `createdAt` | `uint256` | — |
| `status` | `SurveyStatus` | — |


```solidity
struct SurveyDetails {
    address owner;
    string symbol;
    string metadataCID;
    string questionsCID;
    uint256 totalQuestions;
    uint256 respondentLimit;
    uint256 createdAt;
    SurveyStatus status;
}
```

### `QuestionStats`



**Fields:**

| Name | Type | Description |
|------|------|-------------|
| `total` | `euint64` | — |
| `sumSquares` | `euint64` | — |
| `minScore` | `euint8` | — |
| `maxScore` | `euint8` | — |


```solidity
struct QuestionStats {
    euint64 total;
    euint64 sumSquares;
    euint8 minScore;
    euint8 maxScore;
}
```

### `RespondentStats`



**Fields:**

| Name | Type | Description |
|------|------|-------------|
| `total` | `euint64` | — |
| `sumSquares` | `euint64` | — |
| `minScore` | `euint8` | — |
| `maxScore` | `euint8` | — |


```solidity
struct RespondentStats {
    euint64 total;
    euint64 sumSquares;
    euint8 minScore;
    euint8 maxScore;
}
```



## Enumerations

### `SurveyStatus`



**Values:**

| Value | Description |
|-------|-------------|
| `Created` | — |
| `Active` | — |
| `Closed` | — |
| `Trashed` | — |


```solidity
enum SurveyStatus {
    Created,
    Active,
    Closed,
    Trashed,
}
```



## Events

### `SurveyCreated`



```solidity
SurveyCreated(address indexed owner, string symbol, string metadataCID)
```

**Parameters:**

| Name | Type | Indexed | Description |
|------|------|---------|-------------|
| `indexed` | `address` | — | — |
| `symbol` | `string` | — | — |
| `metadataCID` | `string` | — | — |


### `SurveyMetadataUpdated`



```solidity
SurveyMetadataUpdated(string cid)
```

**Parameters:**

| Name | Type | Indexed | Description |
|------|------|---------|-------------|
| `cid` | `string` | — | — |


### `SurveyQuestionsUpdated`



```solidity
SurveyQuestionsUpdated(uint256 totalQuestions)
```

**Parameters:**

| Name | Type | Indexed | Description |
|------|------|---------|-------------|
| `totalQuestions` | `uint256` | — | — |


### `SurveyPublished`



```solidity
SurveyPublished()
```


### `SurveyClosed`



```solidity
SurveyClosed(uint256 totalRespondents)
```

**Parameters:**

| Name | Type | Indexed | Description |
|------|------|---------|-------------|
| `totalRespondents` | `uint256` | — | — |


### `SurveyDeleted`



```solidity
SurveyDeleted()
```


### `ResponsesSubmitted`



```solidity
ResponsesSubmitted()
```


### `SurveyInitialized`



```solidity
SurveyInitialized(
        address indexed owner,
        string symbol,
        string metadataCID,
        string questionsCID,
        uint256 totalQuestions,
        uint256 respondentLimit
    )
```

**Parameters:**

| Name | Type | Indexed | Description |
|------|------|---------|-------------|
| `indexed` | `address` | — | — |
| `symbol` | `string` | — | — |
| `metadataCID` | `string` | — | — |
| `questionsCID` | `string` | — | — |
| `totalQuestions` | `uint256` | — | — |
| `respondentLimit` | `uint256` | — | — |




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

## Frontend Integration

This starter includes a frontend UI for interacting with the contract. See the `ui/` directory for more information.


---

*This documentation was auto-generated from contract metadata and NatSpec comments.*
