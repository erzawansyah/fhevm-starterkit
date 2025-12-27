# Build Metadata from Contract

Script to automatically generate metadata.json from NatSpec comments in Solidity contracts.

## How to Use

### Basic Usage

```bash
npm run build:metadata <path-to-contract> -- --output <output-path>
```

### Examples

```bash
# Generate metadata for FHECounter contract
npm run build:metadata starters/fhe-counter/contracts/FHECounter.sol -- --output metadata.json

# Generate with specific category and chapter
npm run build:metadata contracts/MyContract.sol -- --category applied --chapter encryption

# With verbose mode to see parsing details
npm run build:metadata contracts/MyContract.sol -- --output metadata.json --verbose

# Custom starter name
npm run build:metadata contracts/MyVoting.sol -- --starter-name simple-voting --output metadata.json
```

## Options

| Option           | Alias | Description                                        | Default         |
| ---------------- | ----- | -------------------------------------------------- | --------------- |
| `<contractPath>` | -     | Path to Solidity contract file (required)          | -               |
| `--output`       | `-o`  | Output path for metadata.json                      | `metadata.json` |
| `--starter-name` | `-n`  | Starter name (auto-detect from contract name)      | auto            |
| `--category`     | `-c`  | Category: fundamental, patterns, applied, advanced | `fundamental`   |
| `--chapter`      | -     | Chapter: basics, encryption, decryption, etc.      | `basics`        |
| `--verbose`      | -     | Show detailed parsing information                  | `false`         |

## What Gets Extracted?

This script extracts information from NatSpec comments in the contract:

### 1. Basic Information

- `@title` - Contract title (becomes label)
- `@notice` - Short contract description
- `@dev` - Development notes
- Contract name (from contract declaration)
- Constructor arguments (from constructor)

### 2. Author Information

- `@author` - Author name, can include email and URL

Supported author formats:

```solidity
/// @author John Doe
/// @author Jane Smith <jane@example.com>
/// @author Alice <alice@example.com> (https://github.com/alice)
```

### 3. FHE Concepts (Auto-detected)

The script automatically detects FHE operations used in the contract and maps them to concepts:

- **arithmetic-operations**: `FHE.add`, `FHE.sub`, `FHE.mul`, `FHE.div`, etc.
- **bitwise-operations**: `FHE.and`, `FHE.or`, `FHE.xor`, `FHE.not`, etc.
- **comparison-operations**: `FHE.eq`, `FHE.ne`, `FHE.ge`, `FHE.gt`, etc.
- **ternary-operations**: `FHE.select`
- **random-operations**: `FHE.randEuint*`, `FHE.randEbool`
- **trivial-encryption**: `FHE.asEbool`, `FHE.asEuint*`, `FHE.asEaddress`
- **access-control**: `FHE.allow`, `FHE.allowThis`, `FHE.allowTransient`, etc.

### 4. Custom Tags

- `@custom:security` - Security considerations
- `@custom:limitations` - Known limitations
- Other custom tags

## Recommended NatSpec Format

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

/**
 * @title Your Contract Title
 * @notice Short description of what this contract does
 * @dev Detailed technical explanation
 * @author Your Name <your.email@example.com> (https://github.com/yourusername)
 *
 * @custom:security
 * - Security consideration 1
 * - Security consideration 2
 *
 * @custom:limitations
 * - Known limitation 1
 * - Known limitation 2
 */
contract YourContract {
    // ... contract code
}
```

## Output Format

Generated metadata.json will follow the StarterMetadataType schema:

```json
{
  "name": "your-contract",
  "contract_name": "YourContract",
  "contract_filename": "YourContract.sol",
  "label": "Your Contract Title",
  "description": "Short description from @notice",
  "version": "1.0.0",
  "fhevm_version": "0.9.1",
  "category": "fundamental",
  "tags": [],
  "concepts": ["arithmetic-operations", "access-control"],
  "chapter": "basics",
  "has_ui": false,
  "authors": [
    {
      "name": "Your Name",
      "email": "your.email@example.com",
      "url": "https://github.com/yourusername"
    }
  ],
  "constructor_args": []
}
```

## Integration with Workflow

### 1. Create New Starter

```bash
# 1. Create contract with NatSpec comments
vim contracts/MyNewContract.sol

# 2. Generate metadata
npm run build:metadata contracts/MyNewContract.sol -- --output starters/my-new-contract/metadata.json --category applied

# 3. Copy contract and test files to starter
cp contracts/MyNewContract.sol starters/my-new-contract/contracts/
cp test/MyNewContract.ts starters/my-new-contract/test/

# 4. Validate metadata
npm run check
```

### 2. Update Existing Starter

```bash
# Regenerate metadata after updating contract
npm run build:metadata starters/fhe-counter/contracts/FHECounter.sol -- --output starters/fhe-counter/metadata.json --category applied --chapter basics
```

## Tips

1. **Use verbose mode** for debugging: `--verbose`
2. **Review output** before committing - ensure concepts are detected correctly
3. **Format NatSpec properly** - use single line for @title and @notice
4. **Include author info** - use full format with email and URL
5. **Document security and limitations** - use @custom tags

## Troubleshooting

### Contract name not detected

- Make sure there is a `contract ContractName` declaration in the file
- Don't use `abstract contract` or `interface`

### Title/Notice not extracted

- Make sure to use `@title` and `@notice` (not `@dev`)
- Format: single line after tag
- Example: `@title This is the title`

### Concepts empty

- Make sure to use FHE operations that exist in config
- Check in `starterkit.config.ts` → `taxonomy.concepts`

### Author not detected

- Use format: `@author Name <email> (url)`
- Email and URL optional but must be in correct format

## References

- [Solidity NatSpec Format](https://docs.soliditylang.org/en/latest/natspec-format.html)
- [AGENTS.md](../AGENTS.md) - Project guidelines
- [StarterKit Config](../starterkit.config.ts) - Taxonomy configuration
