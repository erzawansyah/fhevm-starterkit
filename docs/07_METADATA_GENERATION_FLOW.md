# Build Metadata from Contract

Script untuk generate metadata.json secara otomatis dari NatSpec comments yang ada di Solidity contract.

## Cara Menggunakan

### Basic Usage

```bash
npm run build:metadata <path-to-contract> -- --output <output-path>
```

### Contoh

```bash
# Generate metadata untuk contract FHECounter
npm run build:metadata starters/fhe-counter/contracts/FHECounter.sol -- --output metadata.json

# Generate dengan kategori dan chapter tertentu
npm run build:metadata contracts/MyContract.sol -- --category applied --chapter encryption

# Dengan verbose mode untuk melihat detail parsing
npm run build:metadata contracts/MyContract.sol -- --output metadata.json --verbose

# Custom starter name
npm run build:metadata contracts/MyVoting.sol -- --starter-name simple-voting --output metadata.json
```

## Options

| Option           | Alias | Description                                        | Default         |
| ---------------- | ----- | -------------------------------------------------- | --------------- |
| `<contractPath>` | -     | Path ke file Solidity contract (required)          | -               |
| `--output`       | `-o`  | Output path untuk metadata.json                    | `metadata.json` |
| `--starter-name` | `-n`  | Nama starter (auto-detect dari contract name)      | auto            |
| `--category`     | `-c`  | Category: fundamental, patterns, applied, advanced | `fundamental`   |
| `--chapter`      | -     | Chapter: basics, encryption, decryption, dll       | `basics`        |
| `--verbose`      | -     | Show detailed parsing information                  | `false`         |

## Apa yang Di-extract?

Script ini akan mengambil informasi dari NatSpec comments di contract:

### 1. Basic Information

- `@title` - Judul contract (menjadi label)
- `@notice` - Deskripsi singkat contract
- `@dev` - Development notes
- Contract name (dari deklarasi contract)
- Constructor arguments (dari constructor)

### 2. Author Information

- `@author` - Nama author, bisa include email dan URL

Format author yang didukung:

```solidity
/// @author John Doe
/// @author Jane Smith <jane@example.com>
/// @author Alice <alice@example.com> (https://github.com/alice)
```

### 3. FHE Concepts (Auto-detected)

Script akan otomatis detect FHE operations yang digunakan dalam contract dan mapping ke concepts:

- **arithmetic-operations**: `FHE.add`, `FHE.sub`, `FHE.mul`, `FHE.div`, dll
- **bitwise-operations**: `FHE.and`, `FHE.or`, `FHE.xor`, `FHE.not`, dll
- **comparison-operations**: `FHE.eq`, `FHE.ne`, `FHE.ge`, `FHE.gt`, dll
- **ternary-operations**: `FHE.select`
- **random-operations**: `FHE.randEuint*`, `FHE.randEbool`
- **trivial-encryption**: `FHE.asEbool`, `FHE.asEuint*`, `FHE.asEaddress`
- **access-control**: `FHE.allow`, `FHE.allowThis`, `FHE.allowTransient`, dll

### 4. Custom Tags

- `@custom:security` - Security considerations
- `@custom:limitations` - Known limitations
- Custom tags lainnya

## Format NatSpec yang Direkomendasikan

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

Generated metadata.json akan mengikuti schema StarterMetadataType:

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

## Integration dengan Workflow

### 1. Create New Starter

```bash
# 1. Buat contract dengan NatSpec comments
vim contracts/MyNewContract.sol

# 2. Generate metadata
npm run build:metadata contracts/MyNewContract.sol -- --output starters/my-new-contract/metadata.json --category applied

# 3. Copy contract dan test files ke starter
cp contracts/MyNewContract.sol starters/my-new-contract/contracts/
cp test/MyNewContract.ts starters/my-new-contract/test/

# 4. Validate metadata
npm run check
```

### 2. Update Existing Starter

```bash
# Regenerate metadata setelah update contract
npm run build:metadata starters/fhe-counter/contracts/FHECounter.sol -- --output starters/fhe-counter/metadata.json --category applied --chapter basics
```

## Tips

1. **Gunakan verbose mode** untuk debugging: `--verbose`
2. **Review output** sebelum commit - pastikan concepts terdeteksi dengan benar
3. **Format NatSpec dengan baik** - gunakan single line untuk @title dan @notice
4. **Include author info** - gunakan format lengkap dengan email dan URL
5. **Document security dan limitations** - gunakan @custom tags

## Troubleshooting

### Contract name tidak terdeteksi

- Pastikan ada deklarasi `contract ContractName` di file
- Jangan gunakan `abstract contract` atau `interface`

### Title/Notice tidak terambil

- Pastikan menggunakan `@title` dan `@notice` (bukan `@dev`)
- Format: single line after tag
- Contoh: `@title This is the title`

### Concepts kosong

- Pastikan menggunakan FHE operations yang ada di config
- Check di `starterkit.config.ts` → `taxonomy.concepts`

### Author tidak terdeteksi

- Gunakan format: `@author Name <email> (url)`
- Email dan URL optional tapi harus dalam format yang benar

## Referensi

- [Solidity NatSpec Format](https://docs.soliditylang.org/en/latest/natspec-format.html)
- [AGENTS.md](../AGENTS.md) - Project guidelines
- [StarterKit Config](../starterkit.config.ts) - Taxonomy configuration
