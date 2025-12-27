// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";

/// @title erc7984-confidential-token-example
/// @notice Demonstrates how to create a fully encrypted ERC7984 token where all balances and transfers are confidential.
/// @author Zama Team
///
/// @dev This contract implements the ERC7984 standard for encrypted tokens. All balances are stored as encrypted euint64 values,
/// and all transfer operations maintain confidentiality. Users can mint tokens, transfer them using encrypted amounts, and interact
/// with the token without revealing balance or transaction amounts on-chain.
///
/// @custom:category applied
/// @custom:chapter encryption
/// @custom:ui false
/// @custom:security All balances are encrypted; decryption requires prior permission from token holders.
contract ERC7984Example is ERC7984, ZamaEthereumConfig {
    /// @notice Initializes the ERC7984 token with name, symbol, and metadata URI.
    /// @dev The constructor sets up the confidential token infrastructure.
    /// All balances will be stored in encrypted form (euint64).
    constructor() ERC7984("ConfidentialToken", "CTK", "https://example.com/meta") {}

    /// @notice Mints new confidential tokens to a specified address.
    /// @dev The amount is converted to an encrypted euint64 value before minting.
    /// Only the contract deployer or authorized minter should be able to call this.
    /// @param to The recipient address for the minted tokens.
    /// @param amount The plaintext amount of tokens to mint (will be encrypted internally).
    function mint(address to, uint64 amount) public {
        _mint(to, FHE.asEuint64(amount));
    }

    /// @notice Transfers encrypted tokens from sender to recipient using externally encrypted input.
    /// @dev This function allows transfers using encrypted amounts provided externally.
    /// The encrypted amount must include a valid proof for verification via FHE.fromExternal.
    /// @param to The recipient address.
    /// @param input The externally encrypted amount (euint64 format).
    /// @param inputProof The cryptographic proof for the external ciphertext.
    /// @return bool Always returns true on successful transfer.
    function transferExternal(address to, externalEuint64 input, bytes calldata inputProof) external returns (bool) {
        // Verify and import the external ciphertext using FHE.fromExternal
        euint64 amount = FHE.fromExternal(input, inputProof);
        // Execute the confidential transfer
        _transfer(msg.sender, to, amount);
        return true;
    }
}
