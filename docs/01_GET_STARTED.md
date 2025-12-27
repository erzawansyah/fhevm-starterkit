# Get Started with FHEVM StarterKit

Welcome to the quick start guide for FHEVM StarterKit! Here you will find the basic steps to start using this project, including installation, configuration, and running your first example.

## Prerequisites

Make sure you have installed:

- **Node.js** (version 20+)
- **npm** or **yarn**
- **Git**

---

## Step 1: Clone Repository

Clone the FHEVM StarterKit repository from GitHub:

```bash
git clone https://github.com/erzawansyah/fhevm-starterkit.git
cd fhevm-starterkit
```

---

## Step 2: Install Dependencies

Install all required dependencies:

```bash
npm install
```

---

## Step 3: Setup Environment Variables

If you want to use the frontend template (UI), copy the [.env.example](.env.example) file at the repo root to [.env.local](.env.local) **before** running `npm start` or any UI command so it is picked up on first run:

```bash
cp .env.example .env.local
```

Edit the [.env.local](.env.local) file and fill in your WalletConnect Project ID:

```env
VITE_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID_HERE
```

Get a free Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com).

> **Note:** This step is only required if you will be using the relayer UI. For smart contract development only, this step is optional.

---

## Easy Way: Use `npm start`

After step 3, you can directly run:

```bash
npm start
```

This command will automatically run:

- `npm run template:init` — Clone base templates
- `npm run template:build-ui` — Setup frontend environment

Tip: if you want your WalletConnect Project ID applied on the first run, create [.env.local](.env.local) in Step 3 before running `npm start`.

This saves time and ensures all necessary setup is complete!

---

## Step 4: Initialize Base Templates (Alternative)

Initialize base templates by running:

```bash
npm run template:init
```

This command will:

- Clone the official Hardhat template from Zama to `base/hardhat-template/`
- Clone the relayer UI template to `base/frontend-template/`
- Setup markdown templates and overrides

This initialization process **only needs to be done once**. If you want to use the latest version of templates, use:

```bash
npm run template:update
```

---

## Step 5: Build Frontend Template (Optional)

If you didn't use `npm start` above, build the frontend template manually:

```bash
npm run template:build-ui
```

This will setup environment and dependencies for the frontend template.

---

## Step 6: Explore Available Starters

List all available starters:

```bash
npm run starter:list
```

You will see output like:

```
Available Starters:

  fhe-add               - Encrypted addition example (fundamental)
  fhe-counter           - Encrypted counter example (fundamental)
  encrypt-multiple-values - Multiple value encryption (fundamental)
```

---

## Step 7: Create Project from Starter

There are two ways to create a new project from a starter:

### Method 1: Direct with positional argument

```bash
npm run starter:create fhe-add -- --dir my-fhe-add
```

This will create a `workspace/my-fhe-add` folder containing:

- FHEAdd.sol contract (from starter)
- FHEAdd.ts test file
- Hardhat configuration and dependencies

### Method 2: Interactive mode

If you don't provide arguments:

```bash
npm run starter:create
```

The script will display an interactive menu to:

1. Select starter from list
2. Filter by category, chapter, tags, or concepts
3. Specify destination directory
4. Confirm before creating

### Other examples:

```bash
# Create with custom dir
npm run starter:create fhe-counter -- --dir ./my-project

# Create multiple starters
npm run starter:create fhe-add fhe-counter -- --dir ./multi-starters

# Filter by category
npm run starter:create -- --category fundamental --dir ./basics

# Filter by concepts
npm run starter:create -- --concepts "encrypted-add" --dir ./my-starter
```

For a complete explanation of all options, see [02_USING_STARTER_SCRIPT.md](02_USING_STARTER_SCRIPT.md).

---

## Step 8: Setup Project in Workspace

After the project is created, enter the project directory:

```bash
cd workspace/my-fhe-add
```

---

## Step 9: Install Project Dependencies

```bash
npm install
```

---

## Step 10: Compile & Test Contract

Compile the Solidity contract:

```bash
npx hardhat compile
```

Run tests:

```bash
npx hardhat test
```

---

## Step 11: Deploy Contract (Optional)

### Deploy to Hardhat Network (localhost)

Start Hardhat node in the first terminal:

```bash
npx hardhat node
```

In the second terminal, deploy:

```bash
npx hardhat deploy
```

### Deploy to Testnet (Sepolia)

```bash
npx hardhat deploy --network sepolia
```

> **Note:** Make sure you have set up `.env.local` with `SEPOLIA_RPC_URL` and `PRIVATE_KEY` if you want to deploy to testnet.

---

## Step 12: Interact with UI (Optional)

If you have built the frontend template, you can run the UI to interact with the contract:

```bash
npm run starter:start-ui
```

Open your browser to `http://localhost:3000` to access the UI.

---

## Useful Commands

**List all starters:**

```bash
npm run starter:list
```

**Create new starter:**

```bash
npm run starter:create <name> -- --dir <destination>
```

**Update templates:**

```bash
npm run template:update
```

**Clean up (delete) generated projects:**

```bash
npm run starter:clean <project-name>
```

**Lint & format code:**

```bash
npm run lint
npm run format
```

**Generate schema (after modifying Zod schemas):**

```bash
npm run generate:schema
```

---

## Troubleshooting

**Template init fails:**

- Make sure Git is installed
- Check internet connection
- Run `npm run template:reset` then `npm run template:init` again

**Starter create fails:**

- Make sure `npm run template:init` is complete
- Check if the `base/hardhat-template/` folder exists
- Run with `--verbose` flag to see detailed error

**Test fails:**

- Make sure all dependencies are installed (`npm install`)
- Check that the contract compiles without errors (`npx hardhat compile`)

---

## Next Steps

1. Read [00_README.md](00_README.md) for a complete project structure overview
2. See [02_USING_STARTER_SCRIPT.md](02_USING_STARTER_SCRIPT.md) for explanation of the `starter:create` command
3. Study [03_AUTOMATION_SCRIPT.md](03_AUTOMATION_SCRIPT.md) for all available CLI commands
4. Check [04_COMMENTING_GUIDELINES.md](04_COMMENTING_GUIDELINES.md) for contract documentation standards

---

## Contributing

If you want to create a new starter or contribute, read [AGENTS.md](../AGENTS.md) for development guidelines and best practices.
