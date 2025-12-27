# Starter Build and Publish Workflow

This document describes the integrated workflow for building and publishing FHEVM starters with automated metadata generation and documentation.

## Overview

The starter build workflow provides a complete pipeline from draft contract to published starter with zero manual metadata setup:

```
Create Starter        → Modify Contract     → Build Starter       → Publish Starter
npm run               → Edit workspace/      → npm run             → npm run
starter:create        → draft/contracts/     → starter:build       → starter:publish
                      → [Contract.sol]       →                     →
                                            → Auto generates:      → Copies to
                                            → - metadata.json      → starters/[name]/
                                            → - README.md          →
                                            → - dist/ directory    →
```

## Quick Start

### 1. Create a starter project

```bash
npm run starter:create fhe-counter -- --dir draft
```

This creates `workspace/draft/` with:

- `contracts/FHECounter.sol`
- `test/FHECounter.ts`
- `metadata.json` (minimal template)
- `README.md`

### 2. Modify the contract (optional)

Edit the contract with complete NatSpec documentation:

```solidity
/// @title Counter Contract with Encrypted Values
/// @notice This contract demonstrates FHE operations on a simple counter
/// @dev Uses FHEVM for encrypted arithmetic
/// @custom:fhe add,sub,mul
/// @custom:state counter (encrypted counter value)
contract FHECounter {
    // ... contract code
}
```

### 3. Build metadata and documentation

```bash
npm run starter:build
```

This:

1. ✓ Verifies `workspace/draft/` exists
2. ✓ Finds the contract file
3. ✓ **Generates metadata.json** from contract NatSpec comments
4. ✓ **Validates metadata** (checks required fields)
5. ✓ **Generates README.md** from template
6. ✓ Creates `workspace/draft/dist/` with all files

### 4. Review and publish

```bash
npm run starter:publish -- --draft workspace/draft --starter-name fhe-counter-v2
```

This:

1. ✓ Validates dist/ directory
2. ✓ Copies all files to `starters/fhe-counter-v2/`
3. ✓ Creates required directory structure
4. ✓ Publishes the starter as production-ready

---

## Available Commands

### `npm run starter:build`

**Purpose:** Build a starter from workspace/draft with automated metadata and documentation generation.

**What it does:**

- Detects contract in `workspace/draft/contracts/`
- Generates `metadata.json` from contract NatSpec comments
- Validates metadata against schema
- Generates `README.md` using Handlebars template
- Creates `workspace/draft/dist/` with all files

**Options:**

```bash
npm run starter:build -- --draft <path>    # Specify custom draft directory
npm run starter:build -- --verbose         # Show detailed logs
```

**Output:**

```
workspace/draft/dist/
├── contracts/
│   └── ContractName.sol      # Contract file
├── test/
│   └── ContractName.ts       # Test file(s)
├── metadata.json             # Generated metadata
└── README.md                 # Generated documentation
```

### `npm run starter:publish`

**Purpose:** Publish a built starter from dist/ to the starters/ directory.

**What it does:**

- Validates `dist/` directory and metadata
- Copies all files to `starters/[starter-name]/`
- Ensures required directories exist (`contracts/`, `test/`)
- Creates `README.md` if missing

**Options:**

```bash
npm run starter:publish -- --draft <path>          # Source draft directory
npm run starter:publish -- --starter-name <name>   # Custom starter name
npm run starter:publish -- --force                 # Overwrite existing starter
npm run starter:publish -- --verbose               # Show detailed logs
```

**Example:**

```bash
npm run starter:publish -- --draft workspace/draft --starter-name my-new-starter
```

### `npm run build:metadata <file.sol>`

**Purpose:** Generate metadata from a Solidity contract without publishing.

**What it does:**

- Parses contract NatSpec documentation
- Extracts all contract-level tags
- Parses state variables, functions, events, structs, enums
- Detects FHE operations automatically
- Outputs `metadata.json`

**Options:**

```bash
npm run build:metadata path/to/Contract.sol -- --output <path>  # Specify output
npm run build:metadata path/to/Contract.sol -- --verbose        # Detailed logs
```

**Example:**

```bash
npm run build:metadata contracts/MyContract.sol -- --output metadata.json
```

### `npm run generate:docs`

**Purpose:** Generate documentation from metadata using Handlebars template.

**What it does:**

- Loads metadata from `metadata.json`
- Applies `CONTRACT_DOCUMENTATION.md.hbs` template
- Outputs professional markdown documentation

**Options:**

```bash
npm run generate:docs -- --metadata <path>   # Input metadata.json
npm run generate:docs -- --output <path>     # Output documentation.md
npm run generate:docs -- --template <path>   # Custom template
npm run generate:docs -- --verbose           # Detailed logs
```

**Example:**

```bash
npm run generate:docs -- --metadata dist/metadata.json --output dist/README.md
```

---

## Metadata Schema

The generated `metadata.json` includes:

```json
{
  "name": "fhe-counter",
  "contract_name": "FHECounter",
  "label": "FHE Counter",
  "description": "Simple counter with FHE operations",
  "category": "applied",
  "chapter": "basics",
  "version": "1.0.0",
  "authors": [
    {
      "name": "Author Name",
      "email": "email@example.com"
    }
  ],
  "tags": {
    "fhe": ["add", "sub", "mul"],
    "state": ["counter"],
    "visibility": ["public"]
  },
  "state_variables": [
    {
      "name": "counter",
      "type": "euint32",
      "visibility": "private",
      "description": "Encrypted counter value"
    }
  ],
  "functions": [
    {
      "name": "increment",
      "visibility": "public",
      "params": [],
      "returns": [],
      "description": "Increment the counter",
      "custom_tags": {
        "fhe": ["add"]
      }
    }
  ],
  "events": [...],
  "structs": [...],
  "enums": [...]
}
```

---

## NatSpec Documentation Requirements

To leverage the automated metadata generation, use complete NatSpec comments in your contracts:

### Contract Level

```solidity
/// @title Contract Name
/// @notice Brief description for users
/// @dev Implementation notes for developers
/// @custom:fhe operation1,operation2
/// @custom:state stateVar1,stateVar2
/// @custom:events EventName1,EventName2
/// @author Name <email@example.com>
contract MyContract {
```

### Function Level

```solidity
/// @notice What this function does
/// @dev How it works internally
/// @param paramName Description of parameter
/// @return Description of return value
/// @custom:fhe encrypt,decrypt,add
function myFunction(uint32 value) public returns (uint32) {
```

### State Variables

```solidity
/// @notice Description of this variable
/// @dev Important implementation notes
euint32 private counter;
```

See [docs/04_COMMENTING_GUIDELINES.md](04_COMMENTING_GUIDELINES.md) for complete guidelines.

---

## Typical Workflow Example

### Step 1: Create a new starter from existing template

```bash
npm run starter:create fhe-add -- --dir draft
cd workspace/draft
```

### Step 2: Enhance the contract with documentation

```solidity
// contracts/MyFHEAdd.sol
/// @title Encrypted Addition Starter
/// @notice Demonstrates adding two encrypted numbers
/// @dev Uses FHEVM for homomorphic encryption
/// @custom:fhe add,mul
/// @custom:state a,b,sum
/// @author John Doe
contract MyFHEAdd {
    euint32 private a;
    euint32 private b;

    /// @notice Add two encrypted numbers
    /// @param encryptedA First encrypted number
    /// @param encryptedB Second encrypted number
    /// @return sum The encrypted sum
    /// @custom:fhe add
    function add(bytes calldata encryptedA, bytes calldata encryptedB)
        public
        returns (bytes memory sum)
    {
        // implementation
    }
}
```

### Step 3: Build with auto-generated metadata

```bash
npm run starter:build
```

**Output:**

```
✓ Draft directory found
✓ Contract found: MyFHEAdd.sol
✓ Metadata generated
✓ Metadata valid
✓ Documentation generated
✓ Dist directory created

✅ Starter built successfully!

Next steps:
  1. Review the generated files in: workspace/draft/dist
  2. Run: npm run starter:publish -- --draft workspace/draft
     to publish as a new starter
```

### Step 4: Verify generated files

```bash
ls -la workspace/draft/dist/
```

```
MyFHEAdd.sol
MyFHEAdd.ts
metadata.json        # Auto-generated from contract comments
README.md            # Auto-generated from template
```

### Step 5: Publish to starters directory

```bash
npm run starter:publish -- --draft workspace/draft --starter-name my-fhe-add-enhanced
```

**Output:**

```
✓ Dist directory found
✓ Metadata validated
✓ Creating starter directory: starters/my-fhe-add-enhanced/
✓ Copied MyFHEAdd.sol
✓ Copied test files
✓ Copied metadata.json
✓ Copied README.md
✓ Starter published successfully!
```

### Step 6: Use the published starter

```bash
npm run starter:list
npm run starter:create my-fhe-add-enhanced -- --dir my-project
```

---

## Troubleshooting

### "Draft directory not found"

Ensure you created a starter first:

```bash
npm run starter:create <starter-name> -- --dir draft
```

### "No .sol files found"

Verify the contract file is in `workspace/draft/contracts/`:

```bash
ls -la workspace/draft/contracts/
```

### "Missing required metadata field"

The starter:build command validates these required fields:

- `name` - Starter name (kebab-case)
- `contract_name` - Contract class name
- `label` - Human-readable label
- `category` - One of: `fundamental`, `patterns`, `applied`, `advanced`
- `chapter` - Chapter slug (e.g., `basics`, `operations`, `advanced`)
- `authors` - Array with at least one author

Run with `--verbose` to see which field is missing:

```bash
npm run starter:build -- --verbose
```

### "Cannot find name 'metadataPath'"

This is a development error. Ensure you're using the latest CLI:

```bash
npm install
npm run lint
```

---

## Advanced Usage

### Custom draft directory

```bash
npm run starter:build -- --draft /path/to/custom/draft
npm run starter:publish -- --draft /path/to/custom/draft
```

### Force overwrite existing starter

```bash
npm run starter:publish -- --force
```

### Generate docs only

```bash
npm run generate:docs -- --metadata dist/metadata.json --output docs/AUTO_GENERATED.md
```

### Batch metadata generation

```bash
npm run build:metadata contracts/Contract1.sol -- --output metadata1.json
npm run build:metadata contracts/Contract2.sol -- --output metadata2.json
```

---

## Integration with CI/CD

These commands are designed for automation:

```bash
#!/bin/bash
# Generate and publish starter automatically

npm run starter:create my-starter -- --dir draft
npm run starter:build
npm run starter:publish -- --force
npm run starter:list
```

All commands support `--json` flag for machine-readable output:

```bash
npm run starter:list -- --json > starters.json
```

---

## See Also

- [docs/04_COMMENTING_GUIDELINES.md](04_COMMENTING_GUIDELINES.md) - NatSpec documentation standards
- [docs/05_TESTING_GUIDELINES.md](05_TESTING_GUIDELINES.md) - Test file requirements
- [scripts/commands/starterBuild.ts](../scripts/commands/starterBuild.ts) - Implementation details
- [scripts/commands/starterPublish.ts](../scripts/commands/starterPublish.ts) - Publishing logic
- [scripts/commands/buildMetadata.ts](../scripts/commands/buildMetadata.ts) - Metadata extraction
