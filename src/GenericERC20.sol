// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/// @title A generic ERC20 Token
/// @dev Extends ERC20 with burnable, pausable, and permit functionalities.
/// @custom:security-contact support@settlemint.com
contract GenericERC20 is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ERC20Permit {
    event EvBalance (
        address sender
    );
    /// @dev Initializes the contract by setting a `name` and a `symbol` to the token and mints initial tokens to the
    /// deploying address.
    /// @param name The name of the token.
    /// @param symbol The symbol of the token.
    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable() ERC20Permit(name) {
        // Mint 100,000 tokens to the deploying address, adjusting for the token's decimals.
        _mint(msg.sender, 100_000);
    }

    function getBalance() external returns (uint) {
        emit EvBalance(msg.sender);
        return balanceOf(msg.sender);
    }

    /// @dev Pauses all token transfers.
    /// @notice This function can only be called by the contract owner.
    function pause() public onlyOwner {
        _pause();
    }

    /// @dev Unpauses all token transfers.
    /// @notice This function can only be called by the contract owner.
    function unpause() public onlyOwner {
        _unpause();
    }

    /// @dev Mints `amount` tokens and assigns them to `to`, increasing the total supply.
    /// @param to The address to mint tokens to.
    /// @param amount The number of tokens to be minted.
    /// @notice This function can only be called by the contract owner.
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }
}

