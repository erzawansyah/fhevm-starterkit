# **FHEVM StarterKit**

**FHEVM StarterKit** is a curated collection of starter templates, boilerplates, and generation tools for building privacy-preserving smart contracts using Fully Homomorphic Encryption (FHE) on the FHEVM.

This project aims to help developers:

- explore small, focused encrypted contract patterns
- clone ready-made starter templates
- generate new FHEVM projects from a clean boilerplate
- experiment quickly through minimal UI playgrounds
- optionally enhance scaffolding and documentation using AI

StarterKit is designed to support both **learning** and **production-ready development**.

---

## ⭐ **What This Repository Provides**

- **Curated Starters** — small, focused FHEVM templates with contracts, tests, UI, and a minimal tutorial.
- **Starter Generator** — create new FHEVM projects with `npm run starter:init`.
- **Starter Cloner** — copy curated starters with `npm run starter:use`.
- **Metadata-Driven Structure** — each starter includes a `starter.meta.json` file for indexing and documentation.
- **Frontend Hub (WIP)** — a web interface for browsing starters and documentation.
- **Docs Builder (WIP)** — automatic documentation generation from starter metadata and comments.
- **AI-Assisted Mode (Optional)** — enrich project scaffolding and documentation when AI keys are provided.

More features will be added as the project evolves.

---

## 🚀 **Getting Started (early stage)**

Clone a curated starter (coming soon):

```bash
npm run starter:use -- <starter-name>
```

Generate a new boilerplate project:

```bash
npm run starter:init -- <project-name>
```

Run the web interface (in development):

```bash
npm run web
```

Documentation and starter catalog will appear here as the project matures.

---

## 📁 **Project Structure (early version)**

```text
fhevm-starterkit/
  starters/                     # curated FHEVM starters
    example-starter/
      contracts/
      test/
      ui/
      README.md
      starter.meta.json

  boilerplate/                  # base template for starter:init
    contracts/
    test/
    ui/
    scripts/
    hardhat.config.ts
    package.json.template

  scripts/                      # automation scripts for generation and docs
  apps/web/                     # frontend hub (WIP)
  docs/                         # auto-generated documentation (WIP)

  package.json
  README.md
```

---

## ⚠️ **Project Status**

This repository is in active development.
Folder layout, scripts, and features may change as the StarterKit evolves.

---

## 🤝 **Contributions**

Early contributions, feedback, and starter ideas are welcome.
Starter guidelines, metadata schema, and contribution rules will be provided soon.
