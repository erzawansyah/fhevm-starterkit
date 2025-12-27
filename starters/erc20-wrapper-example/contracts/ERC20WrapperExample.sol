// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {
    ERC7984ERC20Wrapper
} from "@openzeppelin/confidential-contracts/token/ERC7984/extensions/ERC7984ERC20Wrapper.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title ERC20 Wrapper Example
/// @notice Demonstrates how to wrap a public ERC20 token into a confidential ERC7984 token, enabling encrypted balance operations.
/// @author Zama Team
///
/// @dev This contract acts as a wrapper that converts standard ERC20 tokens into encrypted ERC7984 tokens.
/// Users deposit public ERC20 tokens and receive encrypted ERC7984 tokens that support homomorphic operations
/// while maintaining balance privacy. All balances are stored encrypted and can only be decrypted by authorized parties.
///
/// @custom:category applied
/// @custom:chapter encryption
/// @custom:ui false
/// @custom:security All balances are encrypted; decryption requires prior permission from the account holder.
contract ERC20WrapperExample is ERC7984ERC20Wrapper, ZamaEthereumConfig {
    /// @notice Initializes the ERC7984ERC20Wrapper with a reference to the underlying public ERC20 token.
    /// @dev The wrapper creates encrypted token wMCK that represents wrapped MCK tokens.
    /// @param underlyingToken The public ERC20 token to be wrapped.
    constructor(
        IERC20 underlyingToken
    ) ERC7984ERC20Wrapper(underlyingToken) ERC7984("Wrapped Mock Token", "wMCK", "") {}
}

/// @title Mock ERC20 Token
/// @notice A simple ERC20 token used for testing the wrapper functionality.
/// @author Zama Team
///
/// @dev This is a test token contract that mints an initial supply to the deployer.
/// It is used in conjunction with ERC20WrapperExample to demonstrate wrapping public tokens.
contract MockERC20 is ERC20 {
    /// @notice Mints the initial token supply (1,000,000 tokens with 18 decimals).
    /// @dev The constructor automatically mints 1,000,000 * 10^18 tokens to msg.sender.
    constructor() ERC20("Mock Token", "MCK") {
        _mint(msg.sender, 1000000 * 10 ** 18);
    }

    /// @notice Allows minting additional tokens to a specified address.
    /// @dev This is a public function for testing purposes; production tokens typically restrict minting.
    /// @param to The recipient address.
    /// @param amount The number of tokens to mint (in the smallest unit).
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
