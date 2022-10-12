// SPDX-License-Identifier: MIT
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import { ERC20Upgradeable } from "openzeppelin-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import { VaultAPI, BaseWrapper } from "../../../externals/yearn/BaseWrapper.sol";

contract AffiliateToken is ERC20Upgradeable, BaseWrapper {
  /// @notice The EIP-712 typehash for the contract's domain
  bytes32 public constant DOMAIN_TYPEHASH =
    keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
  bytes32 public DOMAIN_SEPARATOR;

  /// @notice The EIP-712 typehash for the permit struct used by the contract
  bytes32 public constant PERMIT_TYPEHASH =
    keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

  /// @notice A record of states for signing / validating signatures
  mapping(address => uint256) public nonces;

  address public affiliate;

  address public pendingAffiliate;

  uint8 internal __decimals;

  modifier onlyAffiliate() {
    require(msg.sender == affiliate);
    _;
  }

  function __AffiliateToken_init(
    address _token,
    address _registry,
    string memory name,
    string memory symbol
  ) internal onlyInitializing {
    __ERC20_init(name, symbol);
    __BaseWrapper_init(_token, _registry);

    DOMAIN_SEPARATOR = keccak256(
      abi.encode(DOMAIN_TYPEHASH, keccak256(bytes(name)), keccak256(bytes("1")), _getChainId(), address(this))
    );
    affiliate = msg.sender;
    __decimals = uint8(ERC20Upgradeable(address(token)).decimals());
  }

  function decimals() public view override returns (uint8) {
    return __decimals;
  }

  function _getChainId() internal view returns (uint256) {
    return block.chainid;
  }

  function setAffiliate(address _affiliate) external onlyAffiliate {
    pendingAffiliate = _affiliate;
  }

  function acceptAffiliate() external {
    require(msg.sender == pendingAffiliate);
    affiliate = msg.sender;
  }

  function _shareValue(uint256 numShares) internal view returns (uint256) {
    uint256 totalShares = totalSupply();

    if (totalShares > 0) {
      return (totalVaultBalance(address(this)) * numShares) / totalShares;
    } else {
      return numShares;
    }
  }

  function pricePerShare() public view returns (uint256) {
    return (totalVaultBalance(address(this)) * (10**uint256(decimals()))) / totalSupply();
  }

  function _sharesForValue(uint256 amount) internal view returns (uint256) {
    // total wrapper assets before deposit (assumes deposit already occured)
    uint256 totalBalance = totalVaultBalance(address(this));
    if (totalBalance > amount) {
      return (totalSupply() * amount) / (totalBalance - amount);
    } else {
      return amount;
    }
  }

  function deposit(uint256 amount) public virtual returns (uint256 deposited) {
    deposited = _deposit(msg.sender, address(this), amount, true); // `true` = pull from `msg.sender`
    uint256 shares = _sharesForValue(deposited); // NOTE: Must be calculated after deposit is handled
    _mint(msg.sender, shares);
  }

  function withdraw(uint256 shares) public virtual returns (uint256 withdrawn) {
    withdrawn = _withdraw(address(this), msg.sender, _shareValue(shares), true); // `true` = withdraw from `bestVault`
    _burn(msg.sender, shares);
  }

  function migrate() external onlyAffiliate returns (uint256) {
    return _migrate(address(this));
  }

  function migrate(uint256 amount) external onlyAffiliate returns (uint256) {
    return _migrate(address(this), amount);
  }

  function migrate(uint256 amount, uint256 maxMigrationLoss) external onlyAffiliate returns (uint256) {
    return _migrate(address(this), amount, maxMigrationLoss);
  }

  /**
   * @notice Triggers an approval from owner to spends
   * @param owner The address to approve from
   * @param spender The address to be approved
   * @param amount The number of tokens that are approved (2^256-1 means infinite)
   * @param deadline The time at which to expire the signature
   * @param v The recovery byte of the signature
   * @param r Half of the ECDSA signature pair
   * @param s Half of the ECDSA signature pair
   */
  function permit(
    address owner,
    address spender,
    uint256 amount,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external {
    require(owner != address(0), "permit: signature");
    require(block.timestamp <= deadline, "permit: expired");

    bytes32 structHash = keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, amount, nonces[owner]++, deadline));
    bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));

    address signatory = ecrecover(digest, v, r, s);
    require(signatory == owner, "permit: unauthorized");

    _approve(owner, spender, amount);
  }
}
