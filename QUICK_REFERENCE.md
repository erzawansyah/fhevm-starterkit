# Complete Starter Build & Publish Workflow - Quick Reference

## Status: ✅ PRODUCTION READY

All integration tasks complete. Automated metadata generation and starter publishing fully operational.

---

## 5-Minute Quick Start

```bash
# 1️⃣  Create a new starter
npm run starter:create fhe-counter -- --dir draft

# 2️⃣  Build (auto-generates metadata + docs)
npm run starter:build

# 3️⃣  Publish to starters directory
npm run starter:publish

# 4️⃣  View published starter
npm run starter:list
```

That's it! Your starter is now published and ready to use.

---

## Command Reference

### 1. `npm run starter:build`

**Auto-generates metadata and documentation from contract**

```bash
# Basic usage
npm run starter:build

# With custom draft directory
npm run starter:build -- --draft-dir workspace/draft

# With verbose logging
npm run starter:build -- --verbose

# Show help
npm run starter:build -- --help
```

**What it does:**

1. ✓ Verifies `workspace/draft/` exists
2. ✓ Finds `.sol` contract file
3. ✓ Generates `metadata.json` from NatSpec comments
4. ✓ Validates metadata against schema
5. ✓ Generates `README.md` from template
6. ✓ Creates `workspace/draft/dist/` with all files

**Output Location:** `workspace/draft/dist/`

---

### 2. `npm run starter:publish`

**Publishes built starter to starters/ directory**

```bash
# Basic usage (uses metadata.json for starter name)
npm run starter:publish

# With custom draft path
npm run starter:publish -- --draft-dir workspace/draft

# With custom starter name
npm run starter:publish -- --starter-name my-custom-name

# Force overwrite existing
npm run starter:publish -- --force

# With verbose logging
npm run starter:publish -- --verbose

# Show help
npm run starter:publish -- --help
```

**What it does:**

1. ✓ Reads `dist/metadata.json`
2. ✓ Validates metadata
3. ✓ Creates `starters/[name]/` directory
4. ✓ Copies all files from `dist/`
5. ✓ Ensures required directories exist
6. ✓ Creates README.md if missing

**Output Location:** `starters/[starter-name]/`

---

### 3. `npm run build:metadata`

**Extract metadata from any Solidity contract**

```bash
# Basic usage
npm run build:metadata contracts/MyContract.sol

# With output path
npm run build:metadata contracts/MyContract.sol -- --output metadata.json

# With verbose logging
npm run build:metadata contracts/MyContract.sol -- --verbose

# Show help
npm run build:metadata -- --help
```

**Generates:** JSON file with contract documentation structured by category

---

### 4. `npm run generate:docs`

**Generate markdown docs from metadata**

```bash
# Basic usage
npm run generate:docs

# With custom metadata input
npm run generate:docs -- --metadata dist/metadata.json

# With custom output
npm run generate:docs -- --output docs/AUTO.md

# With custom template
npm run generate:docs -- --template my-template.hbs

# Show help
npm run generate:docs -- --help
```

**Generates:** Professional markdown documentation

---

## Typical Workflow

### Scenario: Create and Publish a New FHE Starter

#### Step 1: Create from existing starter

```bash
npm run starter:create fhe-add -- --dir draft
```

Creates:

```
workspace/draft/
├── contracts/
│   └── FHEAdd.sol
├── test/
│   └── FHEAdd.ts
├── README.md
└── metadata.json
```

#### Step 2: Enhance with documentation

Edit `workspace/draft/contracts/FHEAdd.sol`:

```solidity
/// @title Encrypted Addition
/// @notice Add two encrypted numbers
/// @dev Uses FHEVM homomorphic encryption
/// @custom:fhe add,mul
/// @custom:state a,b,sum
/// @author Jane Doe <jane@example.com>
contract FHEAdd {
    euint32 private a;
    euint32 private b;

    /// @notice Add encrypted values
    /// @param encryptedA First number
    /// @param encryptedB Second number
    /// @return sum Encrypted sum
    /// @custom:fhe add
    function add(bytes calldata encryptedA, bytes calldata encryptedB)
        public
        returns (bytes memory sum)
    {
        // implementation
    }
}
```

#### Step 3: Build (auto-generates everything!)

```bash
npm run starter:build
```

Output:

```
workspace/draft/dist/
├── contracts/
│   └── FHEAdd.sol          ← Contract
├── test/
│   └── FHEAdd.ts           ← Tests
├── metadata.json           ← Auto-generated from comments
└── README.md               ← Auto-generated from template
```

View the generated metadata:

```bash
cat workspace/draft/dist/metadata.json
```

View the generated docs:

```bash
cat workspace/draft/dist/README.md
```

#### Step 4: Publish

```bash
npm run starter:publish
```

Creates:

```
starters/fheadd/              ← Auto-named from contract
├── contracts/
│   └── FHEAdd.sol
├── test/
│   └── FHEAdd.ts
├── metadata.json
└── README.md
```

#### Step 5: Use the published starter

```bash
npm run starter:list
npm run starter:create fheadd -- --dir my-new-project
```

---

## NatSpec Documentation Format

To get automated metadata generation to work perfectly, use these NatSpec tags:

### Contract Level (Required)

```solidity
/// @title Display name of contract
/// @notice User-facing description
/// @dev Developer notes
/// @custom:fhe list,of,operations   ← Auto-detect FHE concepts
/// @custom:state var1,var2          ← State variables used
/// @custom:events EventName          ← Events emitted
/// @author Name <email@example.com>  ← Author info
contract MyContract {
```

### Function Level (Optional)

```solidity
/// @notice What this function does
/// @dev How it works internally
/// @param paramName Parameter description
/// @return returnValue Return value description
/// @custom:fhe operation               ← FHE operations used
function myFunction(uint32 value) public returns (uint32) {
```

### State Variables (Optional)

```solidity
/// @notice What this variable stores
/// @dev Implementation notes
euint32 private myVar;
```

See [docs/04_COMMENTING_GUIDELINES.md](docs/04_COMMENTING_GUIDELINES.md) for complete format.

---

## Generated Metadata Structure

The auto-generated `metadata.json` includes:

```json
{
  "name": "fheadd",
  "contract_name": "FHEAdd",
  "label": "Encrypted Addition",
  "description": "Add two encrypted numbers",
  "category": "fundamental",
  "chapter": "basics",
  "version": "1.0.0",
  "authors": [
    {
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  ],
  "state_variables": [
    {
      "name": "a",
      "type": "euint32",
      "visibility": "private",
      "description": "First encrypted number"
    }
  ],
  "functions": [
    {
      "name": "add",
      "visibility": "public",
      "params": [
        {
          "name": "encryptedA",
          "type": "bytes",
          "description": "First number"
        }
      ],
      "returns": [
        {
          "name": "sum",
          "type": "bytes",
          "description": "Encrypted sum"
        }
      ],
      "custom_tags": {
        "fhe": ["add"]
      }
    }
  ],
  "events": [],
  "structs": [],
  "enums": []
}
```

---

## File Locations

### Key Directories

```
workspace/
├── draft/              ← Your working starter
│   ├── contracts/      ← Your contract files
│   ├── test/           ← Your test files
│   ├── dist/           ← Generated build output
│   ├── metadata.json   ← Generated metadata
│   └── README.md       ← Generated docs

starters/              ← Published starters
├── fhe-counter/
├── fhe-add/
└── my-new-starter/    ← Your published starter
```

### Key Files

```
scripts/commands/
├── starterBuild.ts        ← Build orchestration (206 lines)
└── starterPublish.ts      ← Publishing logic (155 lines)

base/markdown-template/
└── CONTRACT_DOCUMENTATION.md.hbs  ← Doc template (312 lines)

docs/
├── 04_COMMENTING_GUIDELINES.md    ← NatSpec standards
├── 05_TESTING_GUIDELINES.md       ← Test requirements
└── 06_STARTER_BUILD_WORKFLOW.md   ← Complete guide
```

---

## Troubleshooting

### ❌ "Draft directory not found"

```bash
# Solution: Create a starter first
npm run starter:create <name> -- --dir draft
```

### ❌ "No .sol files found"

```bash
# Solution: Check directory structure
ls -la workspace/draft/contracts/
# Should show .sol files
```

### ❌ "Missing required metadata field"

Generated metadata is missing a required field. Run with verbose to see which:

```bash
npm run starter:build -- --verbose
```

Required fields: `name`, `contract_name`, `label`, `category`, `chapter`, `authors`

### ❌ "Starter already exists"

```bash
# Solution: Use --force to overwrite
npm run starter:publish -- --force
# OR use different name
npm run starter:publish -- --starter-name new-name
```

### ❌ "Cannot read metadata.json"

```bash
# Solution: Make sure build completed first
npm run starter:build
# Then verify dist/ exists
ls -la workspace/draft/dist/
```

---

## Real-World Examples

### Example 1: Encrypt/Decrypt Pattern

```bash
npm run starter:create simple-crypto -- --dir draft
npm run starter:build
npm run starter:publish -- --starter-name fhe-encrypt-decrypt
npm run starter:create fhe-encrypt-decrypt -- --dir my-crypto-app
```

### Example 2: Batch Publishing

```bash
# Create multiple variants
npm run starter:create fhe-add -- --dir draft-v1
npm run starter:build -- --draft-dir workspace/draft-v1
npm run starter:publish -- --draft-dir workspace/draft-v1 --starter-name fhe-add-v1

npm run starter:create fhe-add -- --dir draft-v2
npm run starter:build -- --draft-dir workspace/draft-v2
npm run starter:publish -- --draft-dir workspace/draft-v2 --starter-name fhe-add-v2

npm run starter:list
```

### Example 3: Update Existing Starter

```bash
# Create from existing
npm run starter:create fhe-counter -- --dir update-draft

# Modify contract with better docs
# Edit workspace/update-draft/contracts/FHECounter.sol

# Rebuild with new metadata
npm run starter:build -- --draft-dir workspace/update-draft

# Publish with force overwrite
npm run starter:publish -- --draft-dir workspace/update-draft --starter-name fhe-counter --force
```

---

## Performance & Output

### Build Time

- `starter:build`: ~2-3 seconds (contract parsing + metadata generation + doc rendering)
- `starter:publish`: ~1 second (file copy + validation)

### Output Size

- `metadata.json`: 2-10 KB (depends on contract complexity)
- `README.md`: 5-30 KB (depends on documentation completeness)
- Total starter: ~50-200 KB (includes contract + tests)

---

## Advanced Options

### Custom Templates

```bash
# Use custom documentation template
npm run generate:docs -- --template my-docs.hbs
```

### Batch Metadata Generation

```bash
# Generate for multiple contracts
npm run build:metadata contracts/Contract1.sol -- --output meta1.json
npm run build:metadata contracts/Contract2.sol -- --output meta2.json
```

### CI/CD Integration

```bash
#!/bin/bash
# Automated publish script
npm run starter:create my-starter -- --dir draft
npm run starter:build
npm run starter:publish -- --force
npm run starter:list
```

---

## Getting Help

- **Command Help:** `npm run starter:build -- --help`
- **Detailed Guide:** [docs/06_STARTER_BUILD_WORKFLOW.md](docs/06_STARTER_BUILD_WORKFLOW.md)
- **Commenting Format:** [docs/04_COMMENTING_GUIDELINES.md](docs/04_COMMENTING_GUIDELINES.md)
- **Implementation Details:** [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

---

## Summary

✅ **Automated Metadata** - From NatSpec comments, no manual JSON
✅ **Automated Docs** - Professional markdown from templates
✅ **One-Command Build** - Everything in single `npm run starter:build`
✅ **Easy Publishing** - One command to publish to starters/ directory
✅ **Production Ready** - Tested, linted, documented, zero breaking changes

**Status: Ready to use.** 🚀

```bash
npm run starter:create <name> -- --dir draft
npm run starter:build
npm run starter:publish
```
