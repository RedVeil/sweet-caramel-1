// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

contract XPop is
  Ownable,
  ERC20("Popcorn (Redeemable POP)", "xPOP"),
  ERC20Capped(500_000 ether),
  ERC20Burnable,
  ERC20Permit("Popcorn (Redeemable POP)")
{
  function mint(address to, uint256 amount) public onlyOwner {
    _mint(to, amount);
  }

  function _mint(address to, uint256 amount) internal override(ERC20, ERC20Capped) {
    super._mint(to, amount);
  }
}
