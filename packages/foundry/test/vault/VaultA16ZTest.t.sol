// SPDX-License-Identifier: AGPL-3.0
pragma solidity >=0.8.0 <0.9.0;

import "./ERC4626.prop.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { MockERC20 } from "../utils/mocks/MockERC20.sol";
import { MockERC4626 } from "../utils/mocks/MockERC4626.sol";
import { Vault } from "../../src/vault/Vault.sol";
import { KeeperConfig } from "../../src/utils/KeeperIncentivized.sol";
import { IContractRegistry } from "../../src/interfaces/IContractRegistry.sol";

interface IMockERC20 is IERC20 {
  function mint(address to, uint256 value) external;

  function burn(address from, uint256 value) external;
}

abstract contract VaultA16ZTest is ERC4626Prop {
  function setUp() public {
    uint256 forkId = vm.createSelectFork(vm.rpcUrl("FORKING_RPC_URL"));
    vm.selectFork(forkId);

    __underlying__ = address(new MockERC20("Mock Token", "TKN", 18));

    MockERC4626 strategy = new MockERC4626(ERC20(__underlying__), "Mock ERC4626", "MERC4626");

    __vault__ = address(new Vault());
    Vault(__vault__).initialize(
      ERC20(__underlying__),
      IERC4626(address(strategy)),
      IContractRegistry(address(0x4444)),
      Vault.FeeStructure({ deposit: 0, withdrawal: 0, management: 0, performance: 0 }),
      KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1e17, keeperPayout: 9 })
    );

    __delta__ = 0;
  }

  uint256 constant N = 4;

  struct Init {
    address[N] user;
    uint256[N] share;
    uint256[N] asset;
    int256 yield;
  }

  // setup initial vault state as follows:
  //
  // totalAssets == sum(init.share) + init.yield
  // totalShares == sum(init.share)
  //
  // init.user[i]'s assets == init.asset[i]
  // init.user[i]'s shares == init.share[i]
  function setupVault(Init memory init) public virtual {
    // setup initial shares and assets for individual users
    for (uint256 i = 0; i < N; i++) {
      address user = init.user[i];
      vm.assume(_isEOA(user));
      // shares
      uint256 shares = init.share[i];

      // Protect against overflow (total assets will essentially calc shares * shares)
      if (shares >= 802869694970039923231725602841511604274126938199)
        shares = 802869694970039923231725602841511604274126938199 - 1;

      try IMockERC20(__underlying__).mint(user, shares) {} catch {
        vm.assume(false);
      }
      _approve(__underlying__, user, __vault__, shares);
      vm.prank(user);
      try IERC4626(__vault__).deposit(shares, user) {} catch {
        vm.assume(false);
      }
      // assets
      uint256 assets = init.asset[i];
      try IMockERC20(__underlying__).mint(user, assets) {} catch {
        vm.assume(false);
      }
    }

    // setup initial yield for vault
    setupYield(init);
  }

  // setup initial yield
  function setupYield(Init memory init) public virtual {
    if (init.yield >= 0) {
      // gain
      uint256 gain = uint256(init.yield);
      try IMockERC20(__underlying__).mint(__vault__, gain) {} catch {
        vm.assume(false);
      } // this can be replaced by calling yield generating functions if provided by the vault
    } else {
      // loss
      vm.assume(init.yield > type(int256).min); // avoid overflow in conversion
      uint256 loss = uint256(-1 * init.yield);
      try IMockERC20(__underlying__).burn(__vault__, loss) {} catch {
        vm.assume(false);
      } // this can be replaced by calling yield generating functions if provided by the vault
    }
  }

  //
  // asset
  //

  function test_asset(Init memory init) public virtual {
    setupVault(init);
    address caller = init.user[0];
    prop_asset(caller);
  }

  function test_totalAssets(Init memory init) public virtual {
    setupVault(init);
    address caller = init.user[0];
    prop_totalAssets(caller);
  }

  //
  // convert
  //

  function test_convertToShares(Init memory init, uint256 amount) public virtual {
    setupVault(init);
    address caller1 = init.user[0];
    address caller2 = init.user[1];
    prop_convertToShares(caller1, caller2, amount);
  }

  function test_convertToAssets(Init memory init, uint256 amount) public virtual {
    setupVault(init);
    address caller1 = init.user[0];
    address caller2 = init.user[1];
    prop_convertToAssets(caller1, caller2, amount);
  }

  //
  // deposit
  //

  function test_maxDeposit(Init memory init) public virtual {
    setupVault(init);
    address caller = init.user[0];
    address receiver = init.user[1];
    prop_maxDeposit(caller, receiver);
  }

  function test_previewDeposit(Init memory init, uint256 assets) public virtual {
    setupVault(init);
    address caller = init.user[0];
    address receiver = init.user[1];
    address other = init.user[2];
    _approve(__underlying__, caller, __vault__, type(uint256).max);
    prop_previewDeposit(caller, receiver, other, assets);
  }

  function test_deposit(
    Init memory init,
    uint256 assets,
    uint256 allowance
  ) public virtual {
    setupVault(init);
    address caller = init.user[0];
    address receiver = init.user[1];
    _approve(__underlying__, caller, __vault__, allowance);
    prop_deposit(caller, receiver, assets);
  }

  //
  // mint
  //

  function test_maxMint(Init memory init) public virtual {
    setupVault(init);
    address caller = init.user[0];
    address receiver = init.user[1];
    prop_maxMint(caller, receiver);
  }

  function test_previewMint(Init memory init, uint256 shares) public virtual {
    setupVault(init);
    address caller = init.user[0];
    address receiver = init.user[1];
    address other = init.user[2];
    _approve(__underlying__, caller, __vault__, type(uint256).max);
    prop_previewMint(caller, receiver, other, shares);
  }

  function test_mint(
    Init memory init,
    uint256 shares,
    uint256 allowance
  ) public virtual {
    setupVault(init);
    address caller = init.user[0];
    address receiver = init.user[1];
    _approve(__underlying__, caller, __vault__, allowance);
    prop_mint(caller, receiver, shares);
  }

  //
  // withdraw
  //

  function test_maxWithdraw(Init memory init) public virtual {
    setupVault(init);
    address caller = init.user[0];
    address owner = init.user[1];
    prop_maxWithdraw(caller, owner);
  }

  function test_previewWithdraw(Init memory init, uint256 amount) public virtual {
    setupVault(init);
    address caller = init.user[0];
    address receiver = init.user[1];
    address owner = init.user[2];
    address other = init.user[3];
    _approve(__vault__, owner, caller, type(uint256).max);
    prop_previewWithdraw(caller, receiver, owner, other, amount);
  }

  function test_withdraw(
    Init memory init,
    uint256 assets,
    uint256 allowance
  ) public virtual {
    setupVault(init);
    address caller = init.user[0];
    address receiver = init.user[1];
    address owner = init.user[2];
    _approve(__vault__, owner, caller, allowance);
    prop_withdraw(caller, receiver, owner, assets);
  }

  function testFail_withdraw(Init memory init, uint256 assets) public virtual {
    setupVault(init);
    address caller = init.user[0];
    address receiver = init.user[1];
    address owner = init.user[2];
    vm.assume(caller != owner);
    vm.assume(assets > 0);
    _approve(__vault__, owner, caller, 0);
    vm.prank(caller);
    uint256 shares = IERC4626(__vault__).withdraw(assets, receiver, owner);
    assertGt(shares, 0); // this assert is expected to fail
  }

  //
  // redeem
  //

  function test_maxRedeem(Init memory init) public virtual {
    setupVault(init);
    address caller = init.user[0];
    address owner = init.user[1];
    prop_maxRedeem(caller, owner);
  }

  function test_previewRedeem(Init memory init, uint256 amount) public virtual {
    setupVault(init);
    address caller = init.user[0];
    address receiver = init.user[1];
    address owner = init.user[2];
    address other = init.user[3];
    _approve(__vault__, owner, caller, type(uint256).max);
    prop_previewRedeem(caller, receiver, owner, other, amount);
  }

  function test_redeem(
    Init memory init,
    uint256 shares,
    uint256 allowance
  ) public virtual {
    setupVault(init);
    address caller = init.user[0];
    address receiver = init.user[1];
    address owner = init.user[2];
    _approve(__vault__, owner, caller, allowance);
    prop_redeem(caller, receiver, owner, shares);
  }

  function testFail_redeem(Init memory init, uint256 shares) public virtual {
    setupVault(init);
    address caller = init.user[0];
    address receiver = init.user[1];
    address owner = init.user[2];
    vm.assume(caller != owner);
    vm.assume(shares > 0);
    _approve(__vault__, owner, caller, 0);
    vm.prank(caller);
    IERC4626(__vault__).redeem(shares, receiver, owner);
  }

  //
  // round trip tests
  //

  function test_RT_deposit_redeem(Init memory init, uint256 assets) public virtual {
    setupVault(init);
    address caller = init.user[0];
    _approve(__underlying__, caller, __vault__, type(uint256).max);
    prop_RT_deposit_redeem(caller, assets);
  }

  function test_RT_deposit_withdraw(Init memory init, uint256 assets) public virtual {
    setupVault(init);
    address caller = init.user[0];
    _approve(__underlying__, caller, __vault__, type(uint256).max);
    prop_RT_deposit_withdraw(caller, assets);
  }

  function test_RT_redeem_deposit(Init memory init, uint256 shares) public virtual {
    setupVault(init);
    address caller = init.user[0];
    _approve(__underlying__, caller, __vault__, type(uint256).max);
    prop_RT_redeem_deposit(caller, shares);
  }

  function test_RT_redeem_mint(Init memory init, uint256 shares) public virtual {
    setupVault(init);
    address caller = init.user[0];
    _approve(__underlying__, caller, __vault__, type(uint256).max);
    prop_RT_redeem_mint(caller, shares);
  }

  function test_RT_mint_withdraw(Init memory init, uint256 shares) public virtual {
    setupVault(init);
    address caller = init.user[0];
    _approve(__underlying__, caller, __vault__, type(uint256).max);
    prop_RT_mint_withdraw(caller, shares);
  }

  function test_RT_mint_redeem(Init memory init, uint256 shares) public virtual {
    setupVault(init);
    address caller = init.user[0];
    _approve(__underlying__, caller, __vault__, type(uint256).max);
    prop_RT_mint_redeem(caller, shares);
  }

  function test_RT_withdraw_mint(Init memory init, uint256 assets) public virtual {
    setupVault(init);
    address caller = init.user[0];
    _approve(__underlying__, caller, __vault__, type(uint256).max);
    prop_RT_withdraw_mint(caller, assets);
  }

  function test_RT_withdraw_deposit(Init memory init, uint256 assets) public virtual {
    setupVault(init);
    address caller = init.user[0];
    _approve(__underlying__, caller, __vault__, type(uint256).max);
    prop_RT_withdraw_deposit(caller, assets);
  }

  //
  // utils
  //

  function _isContract(address account) internal view returns (bool) {
    return account.code.length > 0;
  }

  function _isEOA(address account) internal view returns (bool) {
    return account.code.length == 0;
  }

  function _approve(
    address token,
    address owner,
    address spender,
    uint256 amount
  ) internal {
    vm.prank(owner);
    _safeApprove(token, spender, 0);
    vm.prank(owner);
    _safeApprove(token, spender, amount);
  }

  function _safeApprove(
    address token,
    address spender,
    uint256 amount
  ) internal {
    (bool success, bytes memory retdata) = token.call(abi.encodeWithSelector(IERC20.approve.selector, spender, amount));
    vm.assume(success);
    if (retdata.length > 0) vm.assume(abi.decode(retdata, (bool)));
  }
}
