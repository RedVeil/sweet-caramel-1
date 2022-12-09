// SPDX-License-Identifier: AGPL-3.0
pragma solidity ^0.8.12;

import { SafeERC20Upgradeable as SafeERC20 } from "openzeppelin-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { ERC20Upgradeable } from "openzeppelin-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { VaultAPI } from "../../../interfaces/external/yearn/IVaultAPI.sol";
import { IERC4626, IERC20 } from "../../../interfaces/vault/IERC4626.sol";
import { FixedPointMathLib } from "solmate/utils/FixedPointMathLib.sol";

// Needs to extract VaultAPI interface out of BaseStrategy to avoid collision
contract YearnWrapper is ERC20Upgradeable {
  using SafeERC20 for IERC20;
  using FixedPointMathLib for uint256;

  VaultAPI public yVault;
  address public token;
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

  error NoAvailableShares();
  error NotEnoughAvailableSharesForAmount();

  // TODO all adapter must use just bytes for init and than decode them inside -- USE BYTES BYTES
  function initialize(VaultAPI _vault) external initializer {
    __ERC20_init(
      string(abi.encodePacked(_vault.name(), "4626adapter")),
      string(abi.encodePacked(_vault.symbol(), "4626"))
    );
    yVault = _vault;
    token = yVault.token();
    _decimals = _vault.decimals();

    INITIAL_CHAIN_ID = block.chainid;
    INITIAL_DOMAIN_SEPARATOR = computeDomainSeparator();

    IERC20(token).approve(address(_vault), type(uint256).max);
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
    return token;
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

  /*//////////////////////////////////////////////////////////////
                      DEPOSIT/WITHDRAWAL LOGIC
  //////////////////////////////////////////////////////////////*/

  function deposit(uint256 assets, address receiver) public returns (uint256 shares) {
    (assets, shares) = _deposit(assets, receiver, msg.sender);

    emit Deposit(msg.sender, receiver, assets, shares);
  }

  function mint(uint256 shares, address receiver) public returns (uint256 assets) {
    assets = previewMint(shares); // No need to check for rounding error, previewMint rounds up.

    (assets, shares) = _deposit(assets, receiver, msg.sender);

    emit Deposit(msg.sender, receiver, assets, shares);
  }

  function withdraw(uint256 assets, address receiver, address owner) public returns (uint256 shares) {
    if (msg.sender != owner) _approve(owner, msg.sender, allowance(owner, msg.sender) - shares);

    (uint256 _withdrawn, uint256 _burntShares) = _withdraw(assets, receiver, msg.sender);

    emit Withdraw(msg.sender, receiver, owner, _withdrawn, _burntShares);
    return _burntShares;
  }

  function redeem(uint256 shares, address receiver, address owner) public returns (uint256 assets) {
    require((assets = previewRedeem(shares)) != 0, "ZERO_ASSETS");

    if (msg.sender != owner) _approve(owner, msg.sender, allowance(owner, msg.sender) - shares);

    (uint256 _withdrawn, uint256 _burntShares) = _withdraw(assets, receiver, msg.sender);

    emit Withdraw(msg.sender, receiver, owner, _withdrawn, _burntShares);
    return _withdrawn;
  }

  /*//////////////////////////////////////////////////////////////
                          ACCOUNTING LOGIC
  //////////////////////////////////////////////////////////////*/

  function totalAssets() public view returns (uint256) {
    return (yVault.balanceOf(address(this)) * yVault.pricePerShare()) / (10 ** _decimals);
  }

  function convertToShares(uint256 assets) public view returns (uint256) {
    return (assets * (10 ** _decimals)) / yVault.pricePerShare();
  }

  function convertToAssets(uint256 shares) public view returns (uint256) {
    return (shares * yVault.pricePerShare()) / (10 ** _decimals);
  }

  function previewDeposit(uint256 assets) public view returns (uint256) {
    return convertToShares(assets);
  }

  function previewMint(uint256 shares) public view returns (uint256) {
    return (shares * yVault.pricePerShare()) / (10 ** _decimals);
  }

  function previewWithdraw(uint256 assets) public view returns (uint256) {
    return (assets * (10 ** _decimals)) / yVault.pricePerShare();
  }

  function previewRedeem(uint256 shares) public view returns (uint256) {
    return (shares * yVault.pricePerShare()) / (10 ** _decimals);
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

  function _deposit(
    uint256 amount, // if `MAX_UINT256`, just deposit everything
    address receiver,
    address depositor
  ) internal returns (uint256 deposited, uint256 mintedShares) {
    VaultAPI _vault = yVault;
    IERC20 _token = IERC20(token);

    if (amount == type(uint256).max) {
      amount = Math.min(_token.balanceOf(depositor), _token.allowance(depositor, address(this)));
    }

    _token.safeTransferFrom(depositor, address(this), amount);

    // beforeDeposit custom logic

    // Depositing returns number of shares deposited
    // NOTE: Shortcut here is assuming the number of tokens deposited is equal to the
    //       number of shares credited, which helps avoid an occasional multiplication
    //       overflow if trying to adjust the number of shares by the share price.
    uint256 beforeBal = _token.balanceOf(address(this));

    mintedShares = _vault.deposit(amount, address(this));

    uint256 afterBal = _token.balanceOf(address(this));
    deposited = beforeBal - afterBal;

    // afterDeposit custom logic
    _mint(receiver, mintedShares);

    // `receiver` now has shares of `_vault` as balance, converted to `token` here
    // Issue a refund if not everything was deposited
    uint256 refundable = amount - deposited;
    if (refundable > 0) SafeERC20.safeTransfer(_token, depositor, refundable);
  }

  function _withdraw(
    uint256 amount, // if `MAX_UINT256`, just withdraw everything
    address receiver,
    address sender
  ) internal returns (uint256 withdrawn, uint256 burntShares) {
    VaultAPI _vault = yVault;

    // Start with the total shares that `sender` has
    // Limit by maximum withdrawal size from each vault
    uint256 availableShares = Math.min(this.balanceOf(sender), _vault.maxAvailableShares());

    if (availableShares == 0) revert NoAvailableShares();

    uint256 estimatedMaxShares = (amount * 10 ** uint256(_vault.decimals())) / _vault.pricePerShare();

    if (estimatedMaxShares > availableShares) revert NotEnoughAvailableSharesForAmount();

    // beforeWithdraw custom logic

    // withdraw from vault and get total used shares
    uint256 beforeBal = _vault.balanceOf(address(this));
    withdrawn = _vault.withdraw(estimatedMaxShares, receiver);
    burntShares = beforeBal - _vault.balanceOf(address(this));
    uint256 unusedShares = estimatedMaxShares - burntShares;

    // afterWithdraw custom logic
    _burn(sender, burntShares);

    // return unusedShares to sender
    if (unusedShares > 0) IERC20(address(_vault)).safeTransfer(sender, unusedShares);
  }
}
