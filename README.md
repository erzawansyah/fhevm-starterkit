# **FHEVM StarterKit**

**FHEVM StarterKit** is a curated collection of starter templates, boilerplates, and generation tools for building privacy-preserving smart contracts using Fully Homomorphic Encryption (FHE) on the FHEVM.

This project aims to help developers:

- explore small, focused encrypted contract patterns
- learn from curated starter examples
- understand FHE operations through practical implementations
- build privacy-preserving smart contracts with confidence

StarterKit is designed to support both **learning** and **production-ready development**.

---

## ⭐ **What This Repository Provides**

- **Curated Starters** — small, focused FHEVM examples with contracts, tests, and documentation
  - ✅ **FHE Counter** — encrypted counter with increment operations
  - ✅ **FHE Addition** — encrypted addition operations demo
- **Base Templates** — official Zama templates for project setup
  - ✅ **fhevm-hardhat-template** — base Hardhat template from Zama
  - ✅ **relayer-ui-template** — UI template for relayer integration
- **Metadata-Driven Structure** — each starter includes a `starter.meta.json` file for indexing and documentation
- **Template Management** — automated scripts for template initialization and updates
- **Documentation** — comprehensive guides and overview for each starter

More starters and features will be added as the project evolves.

---

## 🚀 **Getting Started**

### Prerequisites

```bash
npm install
```

### Initialize Base Template

Set up the official FHEVM Hardhat template from Zama:

```bash
npm run template:init
```

This will clone the [fhevm-hardhat-template](https://github.com/zama-ai/fhevm-hardhat-template) into the `base/` directory.

### Update Template

Update the base template to the latest version:

```bash
npm run template:update
```

### Explore Starters

Browse the `starters/` directory to explore example implementations:

- **fhe-counter/** — Encrypted counter with state management
- **fhe-add/** — Encrypted addition operations

Each starter includes:

- Smart contracts in `contracts/`
- Test files in `test/`
- Metadata in `starter.meta.json`
- Documentation in `README.md`

### Validate Metadata

Check that all starter metadata files are valid:

```bash
npm run validate:metadata
```

---

## 📁 **Project Structure**

```text
fhevm-starterkit/
  starters/                     # curated FHEVM starter examples
    fhe-counter/
      contracts/
        FHECounter.sol
      test/
        FHECounter.ts
      README.md
      starter.meta.json
    fhe-add/
      contracts/
        FHEAdd.sol
      test/
        FHEAdd.ts
      README.md
      starter.meta.json

  base/                         # official Zama templates
    fhevm-hardhat-template/     # base Hardhat template
    relayer-ui-template/        # UI template for relayer

  scripts/                      # automation scripts
    template-init.ts            # initialize base template
    template-update.ts          # update base template
    validate-metadata.ts        # validate starter metadata

  docs/                         # documentation
    OVERVIEW.md

  lib/                          # types and schemas
    schemas/
      starter-meta.schema.json  # JSON schema for metadata
    types/
      starter-meta.ts           # TypeScript types

  starterkit.config.js          # project configuration
  package.json
  README.md
```

---

## 📚 **Available Starters**

### FHE Counter

- **Difficulty**: Beginner
- **Description**: Build a simple encrypted counter with increment operations on encrypted values
- **FHE Operations**: `add`, `euint32`
- **Tags**: fhe, counter, state-management

### FHE Addition

- **Difficulty**: Beginner
- **Description**: Learn how to perform encrypted addition operations using Fully Homomorphic Encryption
- **FHE Operations**: `add`, `euint32`
- **Tags**: fhe, addition, arithmetic

---

## 🛠️ **Scripts Reference**

| Command                     | Description                            |
| --------------------------- | -------------------------------------- |
| `npm run template:init`     | Initialize base FHEVM Hardhat template |
| `npm run template:update`   | Update base template to latest version |
| `npm run validate:metadata` | Validate all starter metadata files    |

---

## ⚠️ **Project Status**

**Current Phase**: Foundation Complete ✅

Completed:

- ✅ Base template integration (fhevm-hardhat-template)
- ✅ Two curated starter examples (Counter & Addition)
- ✅ Metadata schema and validation system
- ✅ Template management automation
- ✅ Documentation structure

In Development:

- 🔄 Additional starter examples
- 🔄 Starter generator tool
- 🔄 Web interface for browsing starters
- 🔄 Enhanced documentation generation

---

## 🤝 **Contributions**

Contributions, feedback, and starter ideas are welcome! Each starter should include:

- Smart contracts demonstrating FHE operations
- Comprehensive test coverage
- Valid `starter.meta.json` following the schema
- Clear documentation in README.md

---

## 📄 **License**

MIT

---

## 🔗 **Resources**

- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Template](https://github.com/zama-ai/fhevm-hardhat-template)
