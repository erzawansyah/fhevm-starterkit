# **FHEVM StarterKit**

**FHEVM StarterKit** is a curated collection of starter templates and foundational tooling for building privacy-preserving smart contracts using Fully Homomorphic Encryption (FHE) on the FHEVM.

This repository is designed to help developers:

- understand FHEVM through small, focused starter projects
- explore encrypted operations via practical, minimal implementations
- reuse curated patterns when building real FHEVM smart contracts
- maintain a clean and consistent development environment using official templates

StarterKit supports developers at all stages — from **learning encrypted programming patterns** to **bootstrapping production-ready FHEVM projects**.

---

## ⭐ **What This Repository Provides**

- **Curated Starters**
  Small, focused FHEVM starter projects containing contracts, tests, documentation, and metadata.
  Currently available:

  - **FHE Counter** — encrypted counter using `euint32`
  - **FHE Addition** — encrypted arithmetic with `euint32`

- **Official Base Templates**
  Located in `base/`, used for initializing new FHEVM projects.

  - `fhevm-hardhat-template` (Zama official Hardhat setup)
  - `relayer-ui-template` (UI template for relayer integration)

- **Metadata-Driven Structure**
  Each starter includes a `starter.meta.json` file used for indexing, validation, and future automation.

- **Template Management Scripts**
  Automation for initializing and updating local copies of official templates.

- **Documentation Foundation**
  Early documentation for understanding the purpose and structure of each starter.

More starters and tooling will be introduced as the StarterKit evolves.

---

## 🚀 **Getting Started**

### Install Dependencies

```bash
npm install
```

---

### Initialize Base Template

Clone the official FHEVM Hardhat template into the `base/` directory:

```bash
npm run template:init
```

### Update the Base Template

Fetch the latest version of the Hardhat template:

```bash
npm run template:update
```

---

### Explore Available Starters

Browse the `starters/` directory:

- `fhe-counter/` — encrypted counter logic
- `fhe-add/` — encrypted addition operations

Each starter contains:

- `contracts/` — smart contract implementation
- `test/` — TypeScript test files
- `README.md` — explanation and usage
- `starter.meta.json` — metadata for indexing and validation

---

### Validate Metadata

Ensure all starter metadata conforms to the schema:

```bash
npm run validate:metadata
```

---

## 📁 **Project Structure**

```text
fhevm-starterkit/
  starters/                     # curated FHEVM starters
    fhe-counter/
    fhe-add/

  base/                         # official Zama templates
    fhevm-hardhat-template/
    relayer-ui-template/

  scripts/                      # automation scripts
    template-init.ts
    template-update.ts
    validate-metadata.ts

  docs/                         # documentation (early stage)
    OVERVIEW.md

  lib/                          # types and schemas
    schemas/
      starter-meta.schema.json
    types/
      starter-meta.ts

  starterkit.config.js          # configuration
  package.json
  README.md
```

---

## 📚 **Current Starters**

### **FHE Counter**

- **Difficulty:** Beginner
- **Description:** Simple encrypted counter demonstrating addition on encrypted state
- **FHE Types:** `euint32`
- **Core Operation:** `add`

---

### **FHE Addition**

- **Difficulty:** Beginner
- **Description:** Basic encrypted arithmetic example using homomorphic addition
- **FHE Types:** `euint32`
- **Core Operation:** `add`

---

## 🛠️ **Scripts Reference**

| Command                     | Description                              |
| --------------------------- | ---------------------------------------- |
| `npm run template:init`     | Initialize official Hardhat template     |
| `npm run template:update`   | Sync base template with upstream version |
| `npm run validate:metadata` | Validate all `starter.meta.json` files   |

---

## ⚠️ **Project Status**

**Current Stage:** Foundation Established

Completed:

- Base template integration
- Two curated starter projects
- Metadata schema + validation tool
- Template initialization & update scripts
- Documentation foundation

In Progress:

- Additional starters across learning categories
- Starter generator tooling
- Metadata-driven docs builder
- Web interface for browsing starters

---

## 🤝 **Contributions**

Contributions and starter proposals are welcome.
A valid starter should include:

- minimal, focused encrypted contract logic
- clean test coverage
- `starter.meta.json` following the schema
- clear documentation in `README.md`

Starter guidelines will be expanded as the repository grows.

---

## 📄 **License**

MIT

---

## 🔗 **Resources**

- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Template](https://github.com/zama-ai/fhevm-hardhat-template)
