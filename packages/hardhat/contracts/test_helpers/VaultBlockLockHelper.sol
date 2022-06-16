// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../core/interfaces/IEIP4626.sol";

interface PopcornVault is IEIP4626, IERC20 {
  function deposit(uint256 amount) external returns (uint256);

  function withdraw(uint256 amount) external returns (uint256);
}

contract VaultBlockLockHelper {
  PopcornVault vault;
  IERC20 baseToken;

  constructor(address _vaultAddress, address _baseToken) {
    vault = PopcornVault(_vaultAddress);
    baseToken = IERC20(_baseToken);
  }

  function deposit() public {
    baseToken.approve(address(vault), 1000 ether);
    vault.deposit(1000 ether, address(this));
  }

  function depositThenRedeem() public {
    baseToken.approve(address(vault), 1000 ether);
    uint256 vaultShares = vault.deposit(1000 ether, address(this));
    vault.redeem(vaultShares, address(this), address(this));
  }

  function mintThenRedeem() public {
    baseToken.approve(address(vault), 1000 ether);
    uint256 vaultShares = vault.mint(1000 ether, address(this));
    vault.redeem(vaultShares, address(this), address(this));
  }

  function depositThenWithdraw() public {
    baseToken.approve(address(vault), 1000 ether);
    vault.deposit(1000 ether, address(this));
    vault.withdraw(500 ether, address(this), address(this));
  }

  function unaryDepositThenWithdraw() public {
    baseToken.approve(address(vault), 1000 ether);
    vault.deposit(1000 ether);
    vault.withdraw(500 ether, address(this), address(this));
  }

  function mintThenWithdraw() public {
    baseToken.approve(address(vault), 1000 ether);
    vault.mint(1000 ether, address(this));
    vault.withdraw(500 ether, address(this), address(this));
  }

  function redeemThenDeposit() public {
    uint256 vaultShares = vault.balanceOf(address(this));
    vault.redeem(vaultShares, address(this), address(this));
    baseToken.approve(address(vault), 1000 ether);
    vault.deposit(1000 ether, address(this));
  }

  function redeemThenMint() public {
    uint256 vaultShares = vault.balanceOf(address(this));
    vault.redeem(vaultShares, address(this), address(this));
    baseToken.approve(address(vault), 1000 ether);
    vault.mint(1000 ether, address(this));
  }

  function withdrawThenDeposit() public {
    vault.withdraw(500 ether, address(this), address(this));
    baseToken.approve(address(vault), 1000 ether);
    vault.deposit(1000 ether, address(this));
  }

  function unaryWithdrawThenDeposit() public {
    vault.withdraw(500 ether);
    baseToken.approve(address(vault), 1000 ether);
    vault.deposit(1000 ether, address(this));
  }

  function withdrawThenMint() public {
    vault.withdraw(500 ether, address(this), address(this));
    baseToken.approve(address(vault), 1000 ether);
    vault.mint(1000 ether, address(this));
  }

  function depositThenTransfer() public {
    baseToken.approve(address(vault), 1000 ether);
    uint256 vaultShares = vault.deposit(1000 ether);
    vault.approve(address(vault), vaultShares);
    vault.transfer(address(0x1), vaultShares);
  }

  function depositThenTransferFrom() public {
    baseToken.approve(address(vault), 1000 ether);
    uint256 vaultShares = vault.deposit(1000 ether);
    vault.approve(address(this), vaultShares);
    vault.transferFrom(address(this), address(0x1), vaultShares);
  }
}
