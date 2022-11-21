// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.12;

import "openzeppelin-contracts/token/ERC20/utils/SafeERC20.sol";
import "openzeppelin-contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import { ERC20 } from "openzeppelin-contracts/token/ERC20/ERC20.sol";
import { Math } from "openzeppelin-contracts/utils/math/Math.sol";
import { VaultAPI } from "../../../interfaces/external/yearn/IVaultAPI.sol";
import "../../../interfaces/IERC4626.sol";
import "../../../interfaces/IYearnVaultWrapper.sol";
import { FixedPointMathLib } from "solmate/utils/FixedPointMathLib.sol";

// Needs to extract VaultAPI interface out of BaseStrategy to avoid collision
contract YearnWrapper is ERC20Upgradeable, IYearnVaultWrapper {
  using SafeERC20 for IERC20;
  using FixedPointMathLib for uint256;

  VaultAPI public yVault;
  IERC20 public token;
  uint256 internal _decimals;

  //  EIP-2612 STORAGE
  uint256 internal INITIAL_CHAIN_ID;
  bytes32 internal INITIAL_DOMAIN_SEPARATOR;
  mapping(address => uint256) public nonces;

  event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares);
  event Withdraw(
    address indexed caller,
    address indexed receiver,
    address indexed owner,
    uint256 assets,
    uint256 shares
  );

  function initialize(VaultAPI _vault) external initializer {
    __ERC20_init(
      string(abi.encodePacked(_vault.name(), "4626adapter")),
      string(abi.encodePacked(_vault.symbol(), "4626"))
    );
    yVault = _vault;
    token = IERC20(yVault.token());
    _decimals = _vault.decimals();

    INITIAL_CHAIN_ID = block.chainid;
    INITIAL_DOMAIN_SEPARATOR = computeDomainSeparator();

    token.approve(address(_vault), type(uint256).max);
  }

  /*//////////////////////////////////////////////////////////////
                      General Views
   //////////////////////////////////////////////////////////////*/

  function DOMAIN_SEPARATOR() public view virtual returns (bytes32) {
    return block.chainid == INITIAL_CHAIN_ID ? INITIAL_DOMAIN_SEPARATOR : computeDomainSeparator();
  }

  function vault() external view returns (address) {
    return address(yVault);
  }

  /*//////////////////////////////////////////////////////////////
                      ERC20 compatibility
   //////////////////////////////////////////////////////////////*/

  function decimals() public view override returns (uint8) {
    return uint8(_decimals);
  }

  function asset() external view returns (address) {
    return address(token);
  }

  /*//////////////////////////////////////////////////////////////
                          ACCOUNTING LOGIC
  //////////////////////////////////////////////////////////////*/

  function totalAssets() public view returns (uint256) {
    return yVault.balanceOf(address(this)).mulDivDown(yVault.pricePerShare(), 10**_decimals);
  }

  function convertToShares(uint256 assets) public view returns (uint256) {
    return assets.mulDivDown(10**_decimals, yVault.pricePerShare());
  }

  function convertToAssets(uint256 shares) public view returns (uint256) {
    return shares.mulDivDown(yVault.pricePerShare(), 10**_decimals);
  }

  function previewDeposit(uint256 assets) public view returns (uint256) {
    return convertToShares(assets); // return less
  }

  function previewMint(uint256 shares) public view returns (uint256) {
    return shares.mulDivUp(yVault.pricePerShare(), 10**_decimals); // return less
  }

  function previewWithdraw(uint256 assets) public view returns (uint256) {
    return assets.mulDivUp(10**_decimals, yVault.pricePerShare()); // return more
  }

  function previewRedeem(uint256 shares) public view returns (uint256) {
    return convertToAssets(shares); // return more
  }

  /*//////////////////////////////////////////////////////////////
                      DEPOSIT/WITHDRAWAL LOGIC
  //////////////////////////////////////////////////////////////*/

  error InvalidReceiver();

  function deposit(uint256 assets, address receiver) public returns (uint256 shares) {
    shares = _deposit(assets, receiver, msg.sender);

    emit Deposit(msg.sender, receiver, assets, shares);
  }

  function mint(uint256 shares, address receiver) public returns (uint256 assets) {
    assets = previewMint(shares); // No need to check for rounding error, previewMint rounds up.

    shares = _deposit(assets, receiver, msg.sender);

    emit Deposit(msg.sender, receiver, assets, shares);
  }

  function _deposit(
    uint256 amount,
    address receiver,
    address depositor
  ) internal returns (uint256 mintedShares) {
    if (receiver == address(0)) revert InvalidReceiver();

    token.safeTransferFrom(depositor, address(this), amount);

    mintedShares = yVault.deposit(amount, address(this));

    _mint(receiver, mintedShares);
  }

  function withdraw(
    uint256 assets,
    address receiver,
    address owner
  ) public returns (uint256 shares) {
    shares = previewWithdraw(assets);

    if (msg.sender != owner) _approve(owner, msg.sender, allowance(owner, msg.sender) - shares);

    (uint256 _withdrawn, uint256 _burntShares) = _withdraw(shares, receiver, msg.sender);

    emit Withdraw(msg.sender, receiver, owner, _withdrawn, _burntShares);
    return _burntShares;
  }

  function redeem(
    uint256 shares,
    address receiver,
    address owner
  ) public returns (uint256 assets) {
    if (msg.sender != owner) _approve(owner, msg.sender, allowance(owner, msg.sender) - shares);

    (uint256 _withdrawn, uint256 _burntShares) = _withdraw(shares, receiver, msg.sender);

    emit Withdraw(msg.sender, receiver, owner, _withdrawn, _burntShares);
    return _withdrawn;
  }

  function _withdraw(
    uint256 amount,
    address receiver,
    address sender
  ) internal returns (uint256 withdrawn, uint256 burntShares) {
    if (receiver == address(0)) revert InvalidReceiver();

    VaultAPI _vault = yVault;

    // withdraw from vault and get total used shares
    uint256 beforeBal = _vault.balanceOf(address(this));
    withdrawn = _vault.withdraw(amount, receiver);
    burntShares = beforeBal - _vault.balanceOf(address(this));

    _burn(sender, burntShares);
  }

  /*//////////////////////////////////////////////////////////////
                    DEPOSIT/WITHDRAWAL LIMIT LOGIC
  //////////////////////////////////////////////////////////////*/

  function maxDeposit(address) public view returns (uint256) {
    VaultAPI _bestVault = yVault;
    uint256 _totalAssets = _bestVault.totalAssets();
    uint256 _depositLimit = _bestVault.depositLimit();
    if (_totalAssets >= _depositLimit) return 0;
    return _depositLimit - _totalAssets;
  }

  function maxMint(address _account) external view returns (uint256) {
    return convertToShares(maxDeposit(_account));
  }

  function maxWithdraw(address owner) external view returns (uint256) {
    return convertToAssets(this.balanceOf(owner));
  }

  function maxRedeem(address owner) external view returns (uint256) {
    return this.balanceOf(owner);
  }

  /*//////////////////////////////////////////////////////////////
                      EIP-2612 LOGIC
  //////////////////////////////////////////////////////////////*/

  function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public virtual {
    require(deadline >= block.timestamp, "PERMIT_DEADLINE_EXPIRED");

    // Unchecked because the only math done is incrementing
    // the owner's nonce which cannot realistically overflow.
    unchecked {
      address recoveredAddress = ecrecover(
        keccak256(
          abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR(),
            keccak256(
              abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                owner,
                spender,
                value,
                nonces[owner]++,
                deadline
              )
            )
          )
        ),
        v,
        r,
        s
      );

      require(recoveredAddress != address(0) && recoveredAddress == owner, "INVALID_SIGNER");

      _approve(recoveredAddress, spender, value);
    }
  }

  function computeDomainSeparator() internal view virtual returns (bytes32) {
    return
      keccak256(
        abi.encode(
          keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
          keccak256(bytes(name())),
          keccak256("1"),
          block.chainid,
          address(this)
        )
      );
  }
}
