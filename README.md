# FHEVM StarterKit

<div align="center">

**A curated collection of starter templates for building privacy-preserving smart contracts using Fully Homomorphic Encryption (FHE) on FHEVM.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## Overview

FHEVM StarterKit helps developers learn and build encrypted smart contracts through practical, minimal implementations. Whether you're just starting with FHE concepts or building production-ready applications, this toolkit provides:

- 📚 **Curated Starters** — Small, focused projects organized by difficulty and use case
- 🛠️ **CLI Tooling** — Automated workflows for creating, building, and managing starters
- 📝 **Auto-Generated Docs** — Documentation generated from NatSpec comments
- 🏗️ **Official Templates** — Integration with Zama's official Hardhat and frontend templates

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/erzawansyah/fhevm-starterkit.git
cd fhevm-starterkit

# 2. Install dependencies
npm install

# 3. Initialize base templates (required)
npm run template:init

# 4. List available starters
npm run starter:list

# 5. Create a project from a starter
npm run starter:create fhe-counter -- --dir my-project
```

---

## Available Starters

| Starter                          | Category    | Description                                |
| -------------------------------- | ----------- | ------------------------------------------ |
| `encrypt-single-value`           | Fundamental | Encrypt a single value using FHE           |
| `encrypt-multiple-values`        | Fundamental | Encrypt multiple values in one transaction |
| `public-decrypt-single-value`    | Fundamental | Public decryption of encrypted values      |
| `public-decrypt-multiple-values` | Fundamental | Public decryption of multiple values       |
| `user-decrypt-single-value`      | Fundamental | User-specific decryption patterns          |
| `user-decrypt-multiple-values`   | Fundamental | User-specific multi-value decryption       |
| `fhe-add`                        | Fundamental | Encrypted arithmetic operations            |
| `fhe-if-then-else`               | Fundamental | Conditional logic with encrypted data      |
| `fhe-counter`                    | Applied     | Encrypted counter with increment/decrement |
| `confidential-survey`            | Applied     | Anonymous survey with encrypted responses  |

---

## Taxonomy

Starters are organized into four categories:

| Category        | Description                                      |
| --------------- | ------------------------------------------------ |
| **Fundamental** | Core FHEVM concepts (1-2 key operations)         |
| **Patterns**    | Best practices and common development patterns   |
| **Applied**     | Real-world use cases (voting, counters, surveys) |
| **Advanced**    | Complex applications (auctions, multi-contract)  |

Each starter is also tagged with **chapters** (encryption, decryption, access-control, etc.) and **concepts** (FHE operations used) for easy discovery.

---

## CLI Commands

### Template Management

| Command                     | Description                                |
| --------------------------- | ------------------------------------------ |
| `npm run template:init`     | Clone official Zama templates into `base/` |
| `npm run template:update`   | Update templates to latest version         |
| `npm run template:reset`    | Delete `base/` templates (⚠️ dangerous)    |
| `npm run template:build-ui` | Setup frontend template environment        |

### Starter Operations

| Command                         | Description                          |
| ------------------------------- | ------------------------------------ |
| `npm run starter:list`          | List all available starters          |
| `npm run starter:create <name>` | Create a project from a starter      |
| `npm run starter:add`           | Create a new draft starter           |
| `npm run starter:build`         | Build starter from draft             |
| `npm run starter:publish`       | Publish built starter to `starters/` |
| `npm run starter:clean`         | Clean workspace starters             |

### Documentation & Metadata

| Command                         | Description                                |
| ------------------------------- | ------------------------------------------ |
| `npm run build:metadata <path>` | Generate metadata from contract NatSpec    |
| `npm run generate:docs <path>`  | Generate docs from metadata.json           |
| `npm run docs:rebuild`          | Rebuild metadata and docs for all starters |

---

## Creating a Starter Project

### Option 1: Direct Selection

```bash
# Create a specific starter
npm run starter:create fhe-counter -- --dir my-counter-app
```

### Option 2: Filter by Category

```bash
# Create all fundamental starters
npm run starter:create -- --category fundamental --dir learning-fhe
```

### Option 3: Filter by Concepts

```bash
# Find starters using specific FHE operations
npm run starter:create -- --concepts "FHE.add,FHE.sub" --dir arithmetic-examples
```

### Option 4: With Frontend

By default, frontend files are included. Skip them with:

```bash
npm run starter:create fhe-counter -- --dir my-project --skip-ui
```

---

## Building New Starters

Follow the draft-to-starter workflow:

```bash
# 1. Add a new draft contract
npm run starter:add ./contracts MyContract

# 2. Generate metadata from NatSpec comments
npm run build:metadata contracts/MyContract.sol -- --starter-name my-starter

# 3. Generate documentation
npm run generate:docs ./workspace/draft/metadata.json

# 4. Build the starter package
npm run starter:build

# 5. Publish to starters/ directory
npm run starter:publish
```

See [docs/06_STARTER_BUILD_WORKFLOW.md](docs/06_STARTER_BUILD_WORKFLOW.md) for detailed instructions.

---

## Project Structure

```
fhevm-starterkit/
├── starters/              # Curated FHEVM starter projects
│   ├── fhe-counter/
│   ├── encrypt-single-value/
│   └── ...
├── base/                  # Official templates (generated locally)
│   ├── hardhat-template/  # Zama FHEVM Hardhat template
│   ├── frontend-template/ # Relayer UI template
│   └── markdown-template/ # Documentation templates
├── workspace/             # Generated projects (gitignored)
├── scripts/               # CLI commands
│   ├── cli.ts             # Main CLI entry point
│   └── commands/          # Individual command handlers
├── lib/                   # Core utilities
│   ├── helper/            # Logger, path-utils, etc.
│   ├── types/             # Zod schemas
│   └── schemas/           # JSON schemas
├── docs/                  # Documentation
└── starterkit.config.ts   # Main configuration
```

---

## Starter Structure

Each starter follows this structure:

```
starters/<starter-name>/
├── contracts/         # Solidity contracts
│   └── Contract.sol
├── test/              # TypeScript tests
│   └── Contract.ts
├── metadata.json      # Starter metadata
└── README.md          # Usage documentation
```

### Metadata Schema

```json
{
  "name": "fhe-counter",
  "contract_name": "FHECounter",
  "contract_filename": "FHECounter.sol",
  "label": "FHECounter Starter",
  "description": "Encrypted counter with increment/decrement",
  "version": "1.0.0",
  "fhevm_version": "0.9.1",
  "category": "fundamental",
  "chapter": "basics",
  "concepts": ["FHE.add", "FHE.sub", "FHE.fromExternal"],
  "has_ui": false,
  "authors": [{ "name": "Author Name" }]
}
```

---

## FHE Concepts Covered

The starters demonstrate these FHEVM operations:

| Concept Group      | Operations                                                         |
| ------------------ | ------------------------------------------------------------------ |
| **Arithmetic**     | `FHE.add`, `FHE.sub`, `FHE.mul`, `FHE.div`, `FHE.min`, `FHE.max`   |
| **Bitwise**        | `FHE.and`, `FHE.or`, `FHE.xor`, `FHE.not`, `FHE.shr`, `FHE.shl`    |
| **Comparison**     | `FHE.eq`, `FHE.ne`, `FHE.ge`, `FHE.gt`, `FHE.le`, `FHE.lt`         |
| **Ternary**        | `FHE.select`                                                       |
| **Encryption**     | `FHE.asEuint8`, `FHE.asEuint32`, `FHE.asEbool`, `FHE.fromExternal` |
| **Access Control** | `FHE.allow`, `FHE.allowThis`, `FHE.isSenderAllowed`                |
| **Random**         | `FHE.randEuint8`, `FHE.randEuint32`, `FHE.randEuint256`            |

---

## Running Tests

After creating a starter project:

```bash
cd workspace/my-project

# Install dependencies
npm install

# Run tests
npx hardhat test

# Run specific test
npx hardhat test --grep "should increment"
```

---

## Requirements

- **Node.js** 20+
- **npm** (included with Node.js)
- **Git** (for template cloning)

---

## Contributing

Contributions are welcome! To add a new starter:

1. Follow the [starter build workflow](docs/06_STARTER_BUILD_WORKFLOW.md)
2. Include properly annotated contracts with NatSpec comments
3. Add comprehensive tests
4. Validate with `npm run lint`
5. Submit a pull request

See [AGENTS.md](AGENTS.md) for detailed contribution guidelines.

---

## Resources

- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Template](https://github.com/zama-ai/fhevm-hardhat-template)
- [Zama Developer Program](https://forms.zama.org/developer-program-bounty-november)

---

## License

MIT © [M.E.W](https://github.com/erzawansyah)

---

<div align="center">

**Built with ❤️ for the Zama Developer Program Bounty**

</div>
