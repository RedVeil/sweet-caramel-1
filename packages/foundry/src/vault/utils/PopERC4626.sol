// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.15;

import { ERC4626Upgradeable, ERC20Upgradeable as ERC20 } from "openzeppelin-upgradeable/token/ERC20/extensions/ERC4626Upgradeable.sol";
import { SafeERC20Upgradeable as SafeERC20 } from "openzeppelin-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import { MathUpgradeable as Math } from "openzeppelin-upgradeable/utils/math/MathUpgradeable.sol";
import { PausableUpgradeable } from "openzeppelin-upgradeable/security/PausableUpgradeable.sol";
import { ACLAuth } from "../../utils/ACLAuth.sol";
import { ContractRegistryAccessUpgradeable, IContractRegistry } from "../../utils/ContractRegistryAccessUpgradeable.sol";

/*
 * @title Beefy ERC4626 Contract
 * @notice ERC4626 wrapper for beefy vaults
 * @author RedVeil
 *
 * Wraps https://github.com/beefyfinance/beefy-contracts/blob/master/contracts/BIFI/vaults/BeefyVaultV6.sol
 */
contract PopERC4626 is ERC4626Upgradeable, PausableUpgradeable, ACLAuth, ContractRegistryAccessUpgradeable {
  using SafeERC20 for ERC20;
  using Math for uint256;

  /*//////////////////////////////////////////////////////////////
                               IMMUTABLES
    //////////////////////////////////////////////////////////////*/

  // TODO !!!!! How do we make sure that contractRegistry is correct?
  // We could set it in the factory but than we need to make sure that its initialized by the factory (can we do that via contractRegistry in init?)
  /**
     @notice Initializes the Vault.
     @param asset The ERC20 compliant token the Vault should accept.
    */
  function __PopERC4626_init(ERC20 asset, IContractRegistry contractRegistry_) public initializer {
    __Pausable_init();
    __ERC4626_init(asset);
    __ContractRegistryAccess_init(contractRegistry_);

    INITIAL_CHAIN_ID = block.chainid;
    INITIAL_DOMAIN_SEPARATOR = computeDomainSeparator();

    feesUpdatedAt = block.timestamp;
  }

  /*//////////////////////////////////////////////////////////////
                            ACCOUNTING LOGIC
    //////////////////////////////////////////////////////////////*/

  /** @dev See {IERC4262-maxDeposit}. */
  function maxDeposit(address) public view virtual override returns (uint256) {
    return paused() ? 0 : type(uint256).max;
  }

  /** @dev See {IERC4262-maxMint}. */
  function maxMint(address) public view virtual override returns (uint256) {
    return paused() ? 0 : type(uint256).max;
  }

  /** @dev See {IERC4262-maxWithdraw}. */
  function maxWithdraw(address owner) public view virtual override returns (uint256) {
    return _convertToAssets(balanceOf(owner), Math.Rounding.Down);
  }

  /** @dev See {IERC4262-maxRedeem}. */
  function maxRedeem(address owner) public view virtual override returns (uint256) {
    return balanceOf(owner);
  }

  /*//////////////////////////////////////////////////////////////
                     DEPOSIT/WITHDRAWAL LIMIT LOGIC
    //////////////////////////////////////////////////////////////*/

  /** @dev See {IERC4262-previewDeposit}. */
  function previewDeposit(uint256 assets) public view virtual override returns (uint256) {
    return paused() ? 0 : _convertToShares(assets, Math.Rounding.Down);
  }

  /** @dev See {IERC4262-previewMint}. */
  function previewMint(uint256 shares) public view virtual override returns (uint256) {
    return paused() ? 0 : _convertToAssets(shares, Math.Rounding.Up);
  }

  /*//////////////////////////////////////////////////////////////
                          INTERNAL HOOKS LOGIC
    //////////////////////////////////////////////////////////////*/

  /**
   * @dev Deposit/mint common workflow.
   */
  function _deposit(
    address caller,
    address receiver,
    uint256 assets,
    uint256 shares
  ) internal virtual override whenNotPaused {
    // If _asset is ERC777, `transferFrom` can trigger a reenterancy BEFORE the transfer happens through the
    // `tokensToSend` hook. On the other hand, the `tokenReceived` hook, that is triggered after the transfer,
    // calls the vault, which is assumed not malicious.
    //
    // Conclusion: we need to do the transfer before we mint so that any reentrancy would happen before the
    // assets are transferred and before the shares are minted, which is a valid state.
    // slither-disable-next-line reentrancy-no-eth
    ERC20(asset()).safeTransferFrom(caller, address(this), assets);

    _mint(receiver, shares);

    afterDeposit(assets, shares);

    emit Deposit(caller, receiver, assets, shares);
  }

  function afterDeposit(uint256 assets, uint256 shares) internal virtual {}

  /**
   * @dev Withdraw/redeem common workflow.
   */
  function _withdraw(
    address caller,
    address receiver,
    address owner,
    uint256 assets,
    uint256 shares
  ) internal virtual override {
    if (caller != owner) {
      _spendAllowance(owner, caller, shares);
    }

    beforeWithdraw(assets, shares);

    // If _asset is ERC777, `transfer` can trigger a reentrancy AFTER the transfer happens through the
    // `tokensReceived` hook. On the other hand, the `tokensToSend` hook, that is triggered before the transfer,
    // calls the vault, which is assumed not malicious.
    //
    // Conclusion: we need to do the transfer after the burn so that any reentrancy would happen after the
    // shares are burned and after the assets are transferred, which is a valid state.
    _burn(owner, shares);

    ERC20(asset()).safeTransfer(receiver, assets);

    emit Withdraw(caller, receiver, owner, assets, shares);
  }

  function beforeWithdraw(uint256 assets, uint256 shares) internal virtual {}

  /*//////////////////////////////////////////////////////////////
                      EIP-2612 LOGIC
  //////////////////////////////////////////////////////////////*/

  error PermitDeadlineExpired(uint256 deadline);
  error InvalidSigner(address signer);

  //  EIP-2612 STORAGE
  uint256 internal INITIAL_CHAIN_ID;
  bytes32 internal INITIAL_DOMAIN_SEPARATOR;
  mapping(address => uint256) public nonces;

  function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public virtual {
    if (deadline < block.timestamp) revert PermitDeadlineExpired(deadline);

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

      if (recoveredAddress == address(0) || recoveredAddress != owner) revert InvalidSigner(recoveredAddress);

      _approve(recoveredAddress, spender, value);
    }
  }

  function DOMAIN_SEPARATOR() public view virtual returns (bytes32) {
    return block.chainid == INITIAL_CHAIN_ID ? INITIAL_DOMAIN_SEPARATOR : computeDomainSeparator();
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
                            HARVESTING LOGIC
    //////////////////////////////////////////////////////////////*/

  event Harvested();

  function harvest() external takeFees {
    beforeHarvest();

    emit Harvested();
  }

  function beforeHarvest() internal virtual {}

  /*//////////////////////////////////////////////////////////////
                      FEE LOGIC
  //////////////////////////////////////////////////////////////*/

  uint256 public managementFee = 5e15; // 50 BPS
  uint256 constant MAX_FEE = 1e18;
  uint256 constant SECONDS_PER_YEAR = 365.25 days;

  uint256 assetsCheckpoint;
  uint256 feesUpdatedAt;

  error InvalidManagementFee(uint256 fee);

  event ManagementFeeChanged(uint256 oldFee, uint256 newFee);

  function accruedManagementFee() public view returns (uint256) {
    uint256 area = (totalAssets() + assetsCheckpoint) * (block.timestamp - feesUpdatedAt);

    return (managementFee.mulDiv(area, 2, Math.Rounding.Down) / SECONDS_PER_YEAR) / MAX_FEE;
  }

  function setManagementFee(uint256 newFee) public onlyRole(VAULTS_CONTROLLER) {
    // Dont take more than 10% managementFee
    if (newFee >= 1e17) revert InvalidManagementFee(newFee);

    emit ManagementFeeChanged(managementFee, newFee);

    managementFee = newFee;
  }

  modifier takeFees() {
    _;

    uint256 managementFee = accruedManagementFee();

    if (managementFee > 0) {
      feesUpdatedAt = block.timestamp;
      _mint(_getContract(FEE_RECIPIENT), convertToShares(managementFee));
    }

    assetsCheckpoint = totalAssets();
  }

  /*//////////////////////////////////////////////////////////////
                      PAUSING LOGIC
  //////////////////////////////////////////////////////////////*/

  function pause() external virtual onlyRole(VAULTS_CONTROLLER) {
    beforeWithdraw(totalAssets(), totalSupply());
    _pause();
  }

  function unpause() external virtual onlyRole(VAULTS_CONTROLLER) {
    _unpause();
    afterDeposit(totalAssets(), totalSupply());
  }

  /*//////////////////////////////////////////////////////////////
                      CONTRACT REGISTRY LOGIC
  //////////////////////////////////////////////////////////////*/

  bytes32 constant VAULTS_CONTROLLER = keccak256("VaultsController");
  bytes32 constant FEE_RECIPIENT = keccak256("FeeRecipient");

  /**
   * @notice Override for ACLAuth and ContractRegistryAccess.
   */
  function _getContract(bytes32 _name)
    internal
    view
    override(ACLAuth, ContractRegistryAccessUpgradeable)
    returns (address)
  {
    return super._getContract(_name);
  }
}
