# AGENTS.md

Single source of instructions for AI coding agents (and a quick reference for contributors).

## Project summary

FHEVM StarterKit is a TypeScript CLI plus a curated set of 16 Solidity starters for learning Zama FHEVM. `template:init` clones the official Zama Hardhat template and `relayer-ui-template` into `base/`; `starter:create` assembles a ready-to-run project in `workspace/<dir>` (Hardhat project + optional prebuilt UI in `ui/`). There is also an authoring flow for new starters (`starter:add` -> `build:metadata` -> `generate:docs` -> `starter:build` -> `starter:publish`).

Frozen on FHEVM 0.9: `@fhevm/solidity` 0.9.1, `@fhevm/hardhat-plugin` 0.3.0-1, relayer-sdk 0.3.0-5. Sepolia is not supported anymore (the old Zama testnet relayer is gone); only local mode (Hardhat mock, chain 31337) works. Do not upgrade FHEVM packages or template pins unless the maintainer asks.

## Stack

Node 20+, TypeScript 5.9, ts-node / tsx, commander, enquirer, handlebars, zod 4, ajv. ESLint 9 + Prettier (with solidity plugin). Generated projects use Hardhat 2, hardhat-deploy, ethers 6, OpenZeppelin (confidential) contracts.

## Commands

```bash
npm install                     # or npm ci
npm run lint                    # ESLint, must be clean
npx tsc --noEmit                # type-check the CLI
npm run starter:list            # list starters
npm run template:init           # clone base/hardhat-template and base/frontend-template at pinned commits
npm run template:build-ui       # npm ci + build of the UI template (uses .env.local or .env.example)
npm start                       # template:init + template:build-ui
npm run starter:create fhe-counter -- --dir my-project [--skip-ui]
cd workspace/my-project && npm install && npx hardhat test
```

## Structure

- `scripts/cli.ts` CLI entry; `scripts/commands/*` one file per command.
- `lib/helper/` logger, paths, starters helpers; `lib/types/` zod schemas; `lib/schemas/` JSON schemas.
- `starters/<name>/` contracts, test, `metadata.json`, `README.md` (one self-contained starter each).
- `base/overrides/` files copied over the Hardhat template (deploy script, `hardhat.config.ts`, `contract-list.json`).
- `base/draft-template/`, `base/markdown-template/` templates for drafts and generated READMEs.
- `base/hardhat-template/`, `base/frontend-template/` cloned by `template:init`, gitignored.
- `workspace/` generated projects, gitignored.
- `docs/` guides and per-starter pages.
- `starterkit.config.ts` template repos and pins, copy rules, taxonomy, validation.

## Conventions

- Starter contracts are documented with NatSpec; `build:metadata` derives `metadata.json` from it (`@custom:category`, `@custom:chapter`, `@custom:tags`, `@custom:ui`, ...).
- New starters go through the draft -> build -> publish flow, not by hand-editing `starters/`.
- Every starter must pass `npx hardhat test` in a generated project (mock mode).
- Keep the README starter table in sync with `metadata.json` (category, chapter).
- Conventional commits.

## Do not

- Commit `.env.local`, `base/hardhat-template/`, `base/frontend-template/`, or `workspace/`.
- Bump FHEVM / relayer-sdk versions or template commit pins without updating the Compatibility table in `README.md`.
- Point the frontend pin in `starterkit.config.ts` at a commit that is not pushed to GitHub (`template:init` clones from GitHub).
