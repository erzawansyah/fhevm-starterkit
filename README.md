# **FHEVM StarterKit**

**FHEVM StarterKit** is a curated collection of starter templates and foundational tooling for building privacy-preserving smart contracts using Fully Homomorphic Encryption (FHE) on the FHEVM.

This repository is designed to help developers:

- understand FHEVM through small, focused starter projects organized by category and difficulty
- explore encrypted operations via practical, minimal implementations
- reuse curated patterns when building real FHEVM smart contracts
- maintain a clean and consistent development environment using official templates
- generate production-ready projects with optional UI scaffolding

StarterKit supports developers at all stages — from **learning encrypted programming patterns** to **bootstrapping production-ready FHEVM projects**.

## **Taxonomy-Based Organization**

Starters are organized into four categories:

- **Fundamental** — Core FHEVM concepts (1-2 key operations)
- **Patterns** — Best practices and common development patterns
- **Applied** — Real-world use cases (voting, counters, etc.)
- **Advanced** — Complex applications (auctions, multi-contract interactions)

Each starter includes flexible **tags** and **concepts** for filtering and discovering relevant examples.

---

## ⭐ **What This Repository Provides**

- **Curated Starters**
  Small, focused FHEVM starter projects containing contracts, tests, documentation, and metadata.
  Currently available:
  - **FHE Counter** (Applied) — encrypted counter using `euint8`
  - **FHE Addition** (Fundamental) — encrypted arithmetic with `euint8`

- **Official Base Templates**
  Located in `base/`, used for initializing new FHEVM projects.
  - `fhevm-hardhat-template` — Zama official Hardhat setup
  - `relayer-ui-template` — UI template for relayer integration

- **Metadata-Driven Structure**
  Each starter includes a `starter.meta.json` file with:
  - Category (fundamental/patterns/applied/advanced)
  - Tags for flexible classification
  - Concepts (FHEVM operations used)
  - Author information and versioning

- **Auto-Generated Documentation**
  Comprehensive docs generated from contract annotations using NatSpec-style comments:
  - Contract-level specs (`@title`, `@author`, `@notice`, `@dev`)
  - State variable documentation
  - Function signatures with parameter types and descriptions
  - Support for structs, enums, constants, and constructors

- **Metadata Automation**
  Automatically generate metadata.json from Solidity contract NatSpec comments:
  - Extract title, description, and author information
  - Auto-detect FHE operations used (concepts)
  - Parse constructor arguments
  - Support for custom tags (@custom:security, @custom:limitations)
  - See [BUILD_METADATA.md](docs/BUILD_METADATA.md) for details

- **Template Management Scripts**
  Automation for initializing and updating local copies of official templates.

- **Planned Features** (In Development)
  - **UI Generator** — Optional web interface for contract interaction
  - **Project Migration** — Transform starters into production boilerplates
  - **Web Interface** — Browse and search starters by category/tags
  - **AI Integration** — Smart suggestions and code assistance

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
    fhe-counter/                # applied: encrypted counter
    fhe-add/                    # fundamental: encrypted addition

  base/                         # official Zama templates
    fhevm-hardhat-template/
    relayer-ui-template/

  scripts/                      # automation scripts
    template-init.ts
    template-update.ts
    validate-metadata.ts
    docs-generate.ts
    helper/
      logger.ts
      normalizeDocblock.ts
      parseLineDoc.ts
      utils.ts
    tools/
      generateDocs.ts
      parser/
        contractSpecs.ts        # parse contract-level docs
        stateVarSpecs.ts        # parse state variable docs
        functionSpecs.ts        # parse function docs
        specialSpecs.ts         # parse struct/enum/constant/constructor

  docs/                         # auto-generated documentation
    OVERVIEW.md
    fundamental/                # fundamental category docs
    applied/                    # applied category docs

  lib/                          # types and schemas
    schemas/
      starter-meta.schema.json
    types/
      starter-meta.ts

  starterkit.config.js          # configuration
  package.json
  README.md
  NOTE.md                       # development notes
```

---

## 📚 **Current Starters**

### **FHE Addition** (Fundamental)

- **Category:** Fundamental
- **Description:** Demonstrates basic addition on encrypted `euint8` values
- **FHE Types:** `euint8`, `externalEuint8`
- **Core Operations:** `FHE.add`, `FHE.fromExternal`, `FHE.allowThis`
- **Concepts:** Encrypted inputs, homomorphic addition, result storage
- **Version:** 1.0.0 (FHEVM 0.9.1)

---

### **FHE Counter** (Applied)

- **Category:** Applied
- **Description:** Simple encrypted counter application with increment/decrement
- **FHE Types:** `euint8`
- **Core Operations:** `FHE.add`, `FHE.sub`
- **Concepts:** Encrypted state management, counter pattern
- **Version:** 1.0.0 (FHEVM 0.9.1)

---

## 🛠️ **Scripts Reference**

### **Available Now**

| Command                     | Description                                           |
| --------------------------- | ----------------------------------------------------- |
| `npm run template:init`     | Initialize official Hardhat template                  |
| `npm run template:update`   | Sync base template with upstream version              |
| `npm run build:metadata`    | Generate metadata.json from contract NatSpec comments |
| `npm run validate:metadata` | Validate all `starter.meta.json` files                |
| `npm run docs:generate`     | Generate documentation from contracts                 |

### **Planned Scripts**

| Command                | Description                               |
| ---------------------- | ----------------------------------------- |
| `npm run starter:use`  | Bootstrap a new project from a starter    |
| `npm run starter:init` | Create a new starter template             |
| `npm run docs`         | Build all documentation                   |
| `npm run check`        | Validate contracts, tests, and metadata   |
| `npm run web`          | Start web interface for browsing starters |
| `npm run build:web`    | Build production web interface            |
| `npm run lint`         | Lint all source files                     |
| `npm run format`       | Format code with Prettier                 |

---

## ⚠️ **Project Status**

**Current Stage:** Core Infrastructure Complete

Completed:

- ✅ Base template integration
- ✅ Two curated starter projects (Fundamental & Applied)
- ✅ Metadata schema + validation tool
- ✅ Template initialization & update scripts
- ✅ Auto-documentation generator with NatSpec parsing
- ✅ Taxonomy system (categories, tags, concepts)
- ✅ Contract parser (supports state vars, functions, structs, enums, constants, constructors)
- ✅ Documentation foundation

In Progress:

- 🚧 Additional starters across all four categories
- 🚧 Starter generator tooling (`starter:init`)
- 🚧 Project migration tool (`starter:use`)
- 🚧 Web interface for browsing starters
- 🚧 UI generator for contract interaction

---

## 🤝 **Contributions**

Contributions and starter proposals are welcome.
A valid starter should include:

- minimal, focused encrypted contract logic
- clean test coverage
- `starter.meta.json` following the schema with proper categorization
- properly annotated contracts using NatSpec-style comments:
  - Contract-level: `@title`, `@author`, `@notice`, `@dev`, `@custom`
  - State variables: `@notice`, optional `@dev`
  - Functions: `@notice`, `@dev`, `@param`, `@return`, optional `@custom`
  - Special elements: structs, enums, constants, constructor
- clear `README.md` explaining the starter's purpose and usage

Detailed annotation guidelines can be found in `NOTE.md`.
Starter guidelines will be expanded as the repository grows.

---

## 📄 **License**

MIT

---

## 🔗 **Resources**

- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Template](https://github.com/zama-ai/fhevm-hardhat-template)
