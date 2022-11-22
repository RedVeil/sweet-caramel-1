// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../src/interfaces/IContractRegistry.sol";
import "../../src/interfaces/IACLRegistry.sol";
import "../../src/vault/Vault.sol";
import "../../src/zapper/VaultsV1Zapper.sol";
import "../../src/utils/KeeperIncentiveV2.sol";
import "../../src/vault/VaultsV1Registry.sol";
import { KeeperConfig } from "../../src/utils/KeeperIncentivized.sol";
import "../../src/vault/wrapper/yearn/YearnWrapper.sol";
import "../../src/interfaces/IERC4626.sol";

interface ICurveSETHPool {
  function calc_withdraw_one_coin(uint256 _burn_amount, int128 i) external returns (uint256);

  function exchange(
    int128 i,
    int128 j,
    uint256 dx,
    uint256 min_dy
  ) external payable;
}

// @dev Fork block 15414618
contract VaultsV1ZapperTest is Test {
  address constant ETH = address(0);
  address constant SETH = 0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb;
  address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
  address constant POP = 0xD0Cd466b34A24fcB2f87676278AF2005Ca8A78c4;

  address constant CURVE_SETH_LP = 0xA3D87FffcE63B53E0d54fAa1cc983B7eB0b74A9c;
  address constant CURVE_SETH_POOL = 0xc5424B857f758E906013F3555Dad202e4bdB4567;
  address constant ZEROX_ROUTER = 0xDef1C0ded9bec7F1a1670819833240f027b25EfF;
  address constant AFFILIATE = address(0);

  address constant CURVE_ZAP_IN = 0x5Ce9b49B7A1bE9f2c3DC2B2A5BaCEA56fa21FBeE;
  address constant CURVE_ZAP_OUT = 0xE03A338d5c305613AfC3877389DD3B0617233387;

  address constant YEARN_REGISTRY = 0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804;
  address constant CONTRACT_REGISTRY = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;
  address constant ACL_REGISTRY = 0x8A41aAa4B467ea545DDDc5759cE3D35984F093f4;
  address constant ACL_ADMIN = 0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f;

  address constant REWARDS_ESCROW = 0xb5cb5710044D1074097c17B7535a1cF99cBfb17F;

  address constant DAO = 0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f;

  address constant YEARN_VAULT = 0x986b4AFF588a109c09B50A03f42E4110E29D353F;

  uint256 constant DEPOSIT_FEE = 50 * 1e14;
  uint256 constant WITHDRAWAL_FEE = 50 * 1e14;
  uint256 constant MANAGEMENT_FEE = 200 * 1e14;
  uint256 constant PERFORMANCE_FEE = 2000 * 1e14;

  VaultsV1Zapper internal zapper;
  Vault internal vault;
  KeeperIncentiveV2 internal keeperIncentive;
  IContractRegistry internal contractRegistry;
  VaultsV1Registry internal vaultsV1Registry;
  YearnWrapper internal yearnWrapper;
  address internal feeRecipient = address(0x1234);

  function setUp() public {
    uint256 forkId = vm.createSelectFork(vm.rpcUrl("FORKING_RPC_URL"), 15414618);
    vm.selectFork(forkId);

    zapper = new VaultsV1Zapper(IContractRegistry(CONTRACT_REGISTRY));
    yearnWrapper = new YearnWrapper();
    address yearnWrapperAddress = address(yearnWrapper);
    YearnWrapper(yearnWrapperAddress).initialize(VaultAPI(YEARN_VAULT));
    address vaultAddress = address(new Vault());
    vault = Vault(vaultAddress);
    vault.initialize(
      ERC20(CURVE_SETH_LP),
      IERC4626(yearnWrapperAddress),
      IContractRegistry(CONTRACT_REGISTRY),
      Vault.FeeStructure({ deposit: 0, withdrawal: 0, management: 0, performance: 0 }),
      KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1, keeperPayout: 9 })
    );

    contractRegistry = IContractRegistry(CONTRACT_REGISTRY);

    vm.startPrank(DAO);
    vm.label(address(0x1234), "FeeRecipient");
    IACLRegistry(ACL_REGISTRY).grantRole(keccak256("INCENTIVE_MANAGER_ROLE"), address(ACL_ADMIN));
    IACLRegistry(ACL_REGISTRY).grantRole(keccak256("VaultsController"), address(DAO));
    IACLRegistry(ACL_REGISTRY).grantRole(keccak256("ApprovedContract"), address(zapper));
    zapper.updateVault(CURVE_SETH_LP, address(vault));
    zapper.updateZaps(CURVE_SETH_LP, CURVE_ZAP_IN, CURVE_ZAP_OUT);
    vm.stopPrank();

    keeperIncentive = new KeeperIncentiveV2(IContractRegistry(CONTRACT_REGISTRY), 25e16, 0);

    vm.startPrank(ACL_ADMIN);
    IContractRegistry(CONTRACT_REGISTRY).updateContract(
      keccak256("KeeperIncentive"),
      address(keeperIncentive),
      keccak256("2")
    );
    IContractRegistry(CONTRACT_REGISTRY).addContract(keccak256("FeeRecipient"), feeRecipient, keccak256("1"));
    keeperIncentive.createIncentive(address(zapper), 0, true, true, CURVE_SETH_LP, 1, 0);
    vm.stopPrank();

    deal(DAI, address(this), 10000 ether);
    IERC20(DAI).approve(address(zapper), type(uint256).max);
    deal(address(this), 20000 ether);
    ICurveSETHPool(CURVE_SETH_POOL).exchange{ value: 1100 ether }(0, 1, 1100 ether, 0);
    IERC20(SETH).approve(address(zapper), type(uint256).max);
  }

  function zapIntoSethVault() public {
    uint256 swapAmount = 1000 ether;
    uint256 minPoolTokens = 0;

    zapper.zapIn(
      DAI,
      ETH,
      CURVE_SETH_POOL,
      CURVE_SETH_LP,
      swapAmount,
      minPoolTokens,
      ZEROX_ROUTER,
      hex"803ba26d000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000003635c9adc5dea00000000000000000000000000000000000000000000000000000081841f714a62f170000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002b6b175474e89094c44da98b954eedeac495271d0f0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000869584cd00000000000000000000000010000000000000000000000000000000000000110000000000000000000000000000000000000000000000258bcff943630894c4"
    );
  }

  function test_zap_in_swap_dai_for_eth() public {
    // This case swaps 1000 DAI for CVXSETH, then deposits to the Popcorn vault.
    uint256 swapAmount = 1000 ether;
    uint256 minPoolTokens = 0;

    zapper.zapIn(
      // The token the end user is "zapping in" to the vault. If the underlying Curve
      // pool does not support this token, zapper will swap it for the intermediate
      // token using 0x. We must construct and pass calldata for a valid 0x order if
      // the zap in needs to perform a swap.
      DAI,
      // The intermediate token we want to swap for. For a Curve pool, this should be
      // one of the tokens in the pool. In this example using the SETH/CVXSETH pool, this
      // is one of SETH or CVXSETH.
      ETH,
      // The address of the Curve Pool which is used as swapAddress for the ZeroXZapIn
      CURVE_SETH_POOL,
      // The address of the Curve LP token which is the vault asset.
      CURVE_SETH_LP,
      // Amount of "zap in" token to swap. In this example, 1000 DAI.
      swapAmount,
      // Minimum Curve LP tokens to receive. In this example, zero.
      minPoolTokens,
      // 0x router address. zapper theoretically supports multiple swap targets, but
      // the only approved address is currently the 0x router.
      ZEROX_ROUTER,
      // Swap data retrieved from the 0x API, representing a DAI/ETH swap order:
      // https://api.0x.org/swap/v1/quote?buyToken=ETH&sellToken=0x6B175474E89094C44Da98b954EedeAC495271d0F&sellAmount=1000000000000000000000&slippagePercentage=0.03
      hex"803ba26d000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000003635c9adc5dea00000000000000000000000000000000000000000000000000000081841f714a62f170000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002b6b175474e89094c44da98b954eedeac495271d0f0001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000869584cd00000000000000000000000010000000000000000000000000000000000000110000000000000000000000000000000000000000000000258bcff943630894c4"
    );

    uint256 vaultBalance = vault.balanceOf(address(this));

    // We get back 482 vault shares. This checks out: CVXSETH is about $2, so we should
    // expect to receive something close to but less than 500 LP tokens in exchange
    // for 1000 DAI.
    assertEq(vaultBalance, 589399193870234992);
  }

  function test_zap_in_swap_dai_for_seth() public {
    // This case swaps 1000 DAI for SETH, then deposits to the Popcorn vault.
    uint256 swapAmount = 1000 ether;
    uint256 minPoolTokens = 0;

    zapper.zapIn(
      DAI,
      // This time SETH is our intermediate token...
      SETH,
      // The rest of these parameters are the same...
      CURVE_SETH_POOL,
      CURVE_SETH_LP,
      swapAmount,
      minPoolTokens,
      ZEROX_ROUTER,
      // Except for different swap data, this time representing a DAI/SETH swap order:
      // https://api.0x.org/swap/v1/quote?buyToken=0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb&sellToken=0x6B175474E89094C44Da98b954EedeAC495271d0F&sellAmount=1000000000000000000000
      hex"415565b00000000000000000000000006b175474e89094c44da98b954eedeac495271d0f0000000000000000000000005e74c9036fb86bd7ecdcb084a0673efc32ea31cb00000000000000000000000000000000000000000000003635c9adc5dea00000000000000000000000000000000000000000000000000000082e04591caed34000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000003e00000000000000000000000000000000000000000000000000000000000000720000000000000000000000000000000000000000000000000000000000000001900000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000320000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000002e000000000000000000000000000000000000000000000000000000000000002e000000000000000000000000000000000000000000000000000000000000002c000000000000000000000000000000000000000000000003635c9adc5dea0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000012556e697377617056330000000000000000000000000000000000000000000000000000000000003635c9adc5dea000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000e592427a0aece92de3edee1f18e0157c05861564000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000426b175474e89094c44da98b954eedeac495271d0f000064dac17f958d2ee523a2206206994597c13d831ec70001f4c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000019000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000002e000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000005e74c9036fb86bd7ecdcb084a0673efc32ea31cb000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000000000000000002a00000000000000000000000000000000000000000000000000000000000000280ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000f536164646c6500000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000000082e04591caed34000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000080000000000000000000000000a6018520eaacc06c30ff2e1b3ee2c7c22e64196a916955860000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000030000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000000000000000000000000000000000000000000000869584cd000000000000000000000000100000000000000000000000000000000000001100000000000000000000000000000000000000000000003772e6cf8863089528"
    );

    uint256 vaultBalance = vault.balanceOf(address(this));

    // We get slightly more LP tokens in exchange for our SETH, due to the current
    // pool balance. This pool is usually imbalanced towards CVXSETH, so we get a
    // bonus for depositing SETH. For all our Curve based zappers, we'll need to
    // calculate off-chain which token would be more advantageous to swap into
    // based on the current Curve pool balance.
    assertEq(vaultBalance, 593083788992255652);
  }

  function test_zap_in_direct_deposit_eth() public {
    // This case directly deposits 1000 CVXSETH to the Curve pool, then deposits to the vault.
    // Since we're zapping in with one of the Curve pool's underlying assets, there's
    // no need to do a 0x swap or send swap calldata.
    uint256 zapAmount = 1000 ether;
    uint256 minPoolTokens = 0;

    zapper.zapIn{ value: zapAmount }(
      ETH,
      ETH,
      CURVE_SETH_POOL,
      CURVE_SETH_LP,
      zapAmount,
      minPoolTokens,
      // SwapTarget is not required when we dont swap
      address(0),
      // SwapData is not required when we dont swap
      hex""
    );

    uint256 vaultBalance = vault.balanceOf(address(this));

    // We get back a little under 1000 vault shares for our 1000 CVXSETH.
    assertEq(vaultBalance, 980062232137761444922);
  }

  function test_zap_in_direct_deposit_seth() public {
    // Same structure as the previous example, but using SETH.
    uint256 zapAmount = 1000 ether;
    uint256 minPoolTokens = 0;

    zapper.zapIn(
      SETH,
      SETH,
      CURVE_SETH_POOL,
      CURVE_SETH_LP,
      zapAmount,
      minPoolTokens,
      ZEROX_ROUTER,
      // Empty swap data for direct deposit
      hex""
    );

    uint256 vaultBalance = vault.balanceOf(address(this));

    // Again, we get a bonus from the Curve pool for depositing SETH
    // rather than CVXSETH.
    assertEq(vaultBalance, 994795838107459813307);
  }

  function test_zap_out_to_dai_via_seth() public {
    // Zap in with 1000 DAI, then zap back out.
    zapIntoSethVault();

    uint256 vaultBalance = vault.balanceOf(address(this));
    assertEq(vaultBalance, 589399193870234992);

    // Approve the zapper to spend our vault shares.
    vault.approve(address(zapper), vaultBalance);
    // vm.roll forward a block since the vault is block locked.
    vm.roll(block.number + 1);

    // Zapping out is trickier than zapping in: in order to construct the 0x swap,
    // we need to calculate the exact amount of SETH to swap for DAI. That means first
    // previewing our vault withdrawal to get a Curve LP token amount, then previewing
    // the amount of SETH we receive when we withdraw our Curve LP tokens as SETH. In this case,
    // that's 492224512049376431331 SETH in wei, which should be equal to `SETHAmount` below.
    // We will also need to calculate this off-chain.

    // Preview amount of Curve LP tokens we receive in exchange for our shares.
    uint256 redeemAmount = vault.previewRedeem(vaultBalance);
    emit log_named_uint("redeem amount", redeemAmount);

    // Preview amount of SETH we receive in exchange for our LP tokens.
    uint256 SETHAmount = ICurveSETHPool(CURVE_SETH_POOL).calc_withdraw_one_coin(redeemAmount, 1);
    emit log_named_uint("SETH amount", SETHAmount);

    uint256 daiBalanceBefore = IERC20(DAI).balanceOf(address(this));

    zapper.zapOut(
      // Vault asset address
      CURVE_SETH_LP,
      // Curve Pool,
      CURVE_SETH_POOL,
      // Amount of shares to zap out
      vaultBalance,
      // Intermediate token (one of CVX or CVXSETH, the two underlying Curve pool tokens)
      SETH,
      // Target token to "zap out"
      DAI,
      // Minimum amount out
      0,
      // 0x router address
      ZEROX_ROUTER,
      // 0x swap order based on calculation above  ()
      // https://api.0x.org/swap/v1/quote?buyToken=0x6B175474E89094C44Da98b954EedeAC495271d0F&sellToken=0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb&sellAmount=589399193870234992
      hex"415565b00000000000000000000000005e74c9036fb86bd7ecdcb084a0673efc32ea31cb0000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000082df771ad897570000000000000000000000000000000000000000000000035168391efca88686000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000003a000000000000000000000000000000000000000000000000000000000000007000000000000000000000000000000000000000000000000000000000000000019000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000002e0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005e74c9036fb86bd7ecdcb084a0673efc32ea31cb000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000000000000000002a00000000000000000000000000000000000000000000000000000000000000280000000000000000000000000000000000000000000000000082df771ad8975700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000143757276650000000000000000000000000000000000000000000000000000000000000000000000082df771ad897570000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000080000000000000000000000000c5424b857f758e906013f3555dad202e4bdb45673df0212400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000190000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000006b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000002c000000000000000000000000000000000000000000000000000000000000002c000000000000000000000000000000000000000000000000000000000000002a0ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000012556e6973776170563300000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff000000000000000000000000000000000000000000000035168391efca886860000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000e592427a0aece92de3edee1f18e0157c058615640000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000002bc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000030000000000000000000000005e74c9036fb86bd7ecdcb084a0673efc32ea31cb000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0000000000000000000000000000000000000000000000000000000000000000869584cd000000000000000000000000100000000000000000000000000000000000001100000000000000000000000000000000000000000000003113622791630895ef"
    );
    uint256 daiBalanceAfter = IERC20(DAI).balanceOf(address(this));
    uint256 daiZappedOut = daiBalanceAfter - daiBalanceBefore;

    // We get back 987 DAI from our round trip. This is inclusive of
    // slippage from the two swaps, but not vault or zapper fees.
    // Vault fees are set to zero in the tests, and zapper fees
    // are currently zero, although zapper has the ability to set
    // them to a nonzero amount.
    assertEq(daiZappedOut, 995826877609544610911);
  }

  function test_zap_out_to_dai_via_eth() public {
    // Zap in with 1000 DAI, then zap back out.
    zapIntoSethVault();

    uint256 vaultBalance = vault.balanceOf(address(this));
    assertEq(vaultBalance, 589399193870234992);

    // Approve the zapper to spend our vault shares.
    vault.approve(address(zapper), vaultBalance);
    // vm.roll forward a block since the vault is block locked.
    vm.roll(block.number + 1);

    // Zapping out is trickier than zapping in: in order to construct the 0x swap,
    // we need to calculate the exact amount of SETH to swap for DAI. That means first
    // previewing our vault withdrawal to get a Curve LP token amount, then previewing
    // the amount of SETH we receive when we withdraw our Curve LP tokens as SETH. In this case,
    // that's 492224512049376431331 SETH in wei, which should be equal to `SETHAmount` below.
    // We will also need to calculate this off-chain.

    // Preview amount of Curve LP tokens we receive in exchange for our shares.
    uint256 redeemAmount = vault.previewRedeem(vaultBalance);
    emit log_named_uint("redeem amount", redeemAmount);

    // Preview amount of SETH we receive in exchange for our LP tokens.
    uint256 SETHAmount = ICurveSETHPool(CURVE_SETH_POOL).calc_withdraw_one_coin(redeemAmount, 0);
    emit log_named_uint("SETH amount", SETHAmount);

    uint256 daiBalanceBefore = IERC20(DAI).balanceOf(address(this));

    zapper.zapOut(
      // Vault asset address
      CURVE_SETH_LP,
      CURVE_SETH_POOL,
      // Amount of shares to zap out
      vaultBalance,
      // Intermediate token (one of CVX or CVXSETH, the two underlying Curve pool tokens)
      ETH,
      // Target token to "zap out"
      DAI,
      // Minimum amount out
      0,
      // 0x router address
      ZEROX_ROUTER,
      // 0x swap order based on calculation above  ()
      // https://api.0x.org/swap/v1/quote?buyToken=0x6B175474E89094C44Da98b954EedeAC495271d0F&sellToken=ETH&sellAmount=571064847952030326
      hex"3598d8ab0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000032dd7d6c0a5dfcd3550000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002bc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000869584cd00000000000000000000000010000000000000000000000000000000000000110000000000000000000000000000000000000000000000e43b33cdc963089664"
    );
    uint256 daiBalanceAfter = IERC20(DAI).balanceOf(address(this));
    uint256 daiZappedOut = daiBalanceAfter - daiBalanceBefore;

    // We get back 987 DAI from our round trip. This is inclusive of
    // slippage from the two swaps, but not vault or zapper fees.
    // Vault fees are set to zero in the tests, and zapper fees
    // are currently zero, although zapper has the ability to set
    // them to a nonzero amount.
    assertEq(daiZappedOut, 998867680438126578067);
  }

  function test_zap_in_fee() public {
    vm.prank(DAO);
    zapper.setFee(CURVE_SETH_LP, true, 100, 0);

    zapIntoSethVault();

    uint256 expectedVaultBalanceWithoutFees = 589399193870234992;
    uint256 expectedFee = (expectedVaultBalanceWithoutFees * 100) / 10_000;
    assertEq(vault.balanceOf(address(this)), expectedVaultBalanceWithoutFees - expectedFee);

    // Make sure the fee was taken
    assertEq(IERC20(CURVE_SETH_LP).balanceOf(address(zapper)), expectedFee);
    (, uint256 accumulated, , ) = zapper.fees(CURVE_SETH_LP);
    assertEq(accumulated, expectedFee);
  }

  function test_zap_out_fee() public {
    vm.prank(DAO);
    zapper.setFee(CURVE_SETH_LP, true, 0, 100);

    zapIntoSethVault();

    uint256 vaultBalance = vault.balanceOf(address(this));
    assertEq(vaultBalance, 589399193870234992);

    // Approve the zapper to spend our vault shares.
    vault.approve(address(zapper), vaultBalance);
    // vm.roll forward a block since the vault is block locked.
    vm.roll(block.number + 1);

    uint256 redeemAmount = vault.previewRedeem(vaultBalance);
    emit log_named_uint("redeem amount", redeemAmount);

    // Preview amount of SETH we receive in exchange for our LP tokens.
    uint256 ETHAmount = ICurveSETHPool(CURVE_SETH_POOL).calc_withdraw_one_coin(redeemAmount, 0);
    emit log_named_uint("ETH amount", ETHAmount);

    uint256 daiBalanceBefore = IERC20(DAI).balanceOf(address(this));

    zapper.zapOut(
      CURVE_SETH_LP,
      CURVE_SETH_POOL,
      vaultBalance,
      ETH,
      DAI,
      0,
      ZEROX_ROUTER,
      hex"3598d8ab0000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000032dd7d6c0a5dfcd3550000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002bc02aaa39b223fe8d0a0e5c4f27ead9083c756cc20001f46b175474e89094c44da98b954eedeac495271d0f000000000000000000000000000000000000000000869584cd00000000000000000000000010000000000000000000000000000000000000110000000000000000000000000000000000000000000000e43b33cdc963089664"
    );
    uint256 daiBalanceAfter = IERC20(DAI).balanceOf(address(this));
    uint256 daiZappedOut = daiBalanceAfter - daiBalanceBefore;

    assertEq(daiZappedOut, 988879185993411068780);

    // Make sure the fee was taken
    uint256 expectedFee = 5893991938702349;
    assertEq(IERC20(CURVE_SETH_LP).balanceOf(address(zapper)), expectedFee);

    (, uint256 accumulated, , ) = zapper.fees(CURVE_SETH_LP);
    assertEq(accumulated, expectedFee);
  }

  function test_global_fee_without_asset_fee() public {
    // Should use GlobalFee

    vm.prank(DAO);
    zapper.setGlobalFee(50, 0);

    zapIntoSethVault();

    uint256 expectedVaultBalanceWithoutFees = 589399193870234992;
    uint256 expectedFee = (expectedVaultBalanceWithoutFees * 50) / 10_000;
    assertEq(vault.balanceOf(address(this)), expectedVaultBalanceWithoutFees - expectedFee);

    // Make sure the fee was taken
    assertEq(IERC20(CURVE_SETH_LP).balanceOf(address(zapper)), expectedFee);
    (, uint256 accumulated, , ) = zapper.fees(CURVE_SETH_LP);
    assertEq(accumulated, expectedFee);
  }

  function test_global_fee_with_disabled_asset_fee() public {
    // Should use GlobalFee

    vm.startPrank(DAO);
    zapper.setFee(CURVE_SETH_LP, false, 100, 0);
    zapper.setGlobalFee(50, 0);
    vm.stopPrank();

    zapIntoSethVault();

    uint256 expectedVaultBalanceWithoutFees = 589399193870234992;
    uint256 expectedFee = (expectedVaultBalanceWithoutFees * 50) / 10_000;
    assertEq(vault.balanceOf(address(this)), expectedVaultBalanceWithoutFees - expectedFee);

    // Make sure the fee was taken
    assertEq(IERC20(CURVE_SETH_LP).balanceOf(address(zapper)), expectedFee);
    (, uint256 accumulated, , ) = zapper.fees(CURVE_SETH_LP);
    assertEq(accumulated, expectedFee);
  }

  function test_global_fee_with_enabled_asset_fee() public {
    // Should use AssetFee

    vm.startPrank(DAO);
    zapper.setFee(CURVE_SETH_LP, true, 100, 0);
    zapper.setGlobalFee(50, 0);
    vm.stopPrank();

    zapIntoSethVault();

    uint256 expectedVaultBalanceWithoutFees = 589399193870234992;
    uint256 expectedFee = (expectedVaultBalanceWithoutFees * 100) / 10_000;

    assertEq(vault.balanceOf(address(this)), expectedVaultBalanceWithoutFees - expectedFee);

    // Make sure the fee was taken
    assertEq(IERC20(CURVE_SETH_LP).balanceOf(address(zapper)), expectedFee);
    (, uint256 accumulated, , ) = zapper.fees(CURVE_SETH_LP);
    assertEq(accumulated, expectedFee);
  }

  function test_set_keeper_config() public {
    vm.startPrank(DAO);
    zapper.setFee(CURVE_SETH_LP, true, 100, 0);
    zapper.setKeeperConfig(
      CURVE_SETH_LP,
      KeeperConfig({ minWithdrawalAmount: 10, incentiveVigBps: 12, keeperPayout: 8 })
    );
    vm.stopPrank();

    (uint256 minWithdrawalAmount, uint256 incentiveVigBps, uint256 keeperPayout) = zapper.keeperConfigs(CURVE_SETH_LP);
    assertEq(minWithdrawalAmount, 10);
    assertEq(incentiveVigBps, 12);
    assertEq(keeperPayout, 8);
  }

  function test_withdraw_fee() public {
    vm.startPrank(DAO);
    zapper.setFee(CURVE_SETH_LP, true, 100, 0);
    zapper.setKeeperConfig(
      CURVE_SETH_LP,
      KeeperConfig({ minWithdrawalAmount: 1, incentiveVigBps: 1e16, keeperPayout: 0 })
    );
    vm.stopPrank();

    zapIntoSethVault();

    uint256 feeBal = IERC20(CURVE_SETH_LP).balanceOf(address(zapper));
    uint256 tipAmount = (feeBal * 1e16) / 1e18;

    vm.prank(DAO);
    zapper.withdrawFees(CURVE_SETH_LP);

    // Check that fee balance was set to 0
    assertEq(IERC20(CURVE_SETH_LP).balanceOf(address(zapper)), 0);
    (, uint256 accumulated, , ) = zapper.fees(CURVE_SETH_LP);
    assertEq(accumulated, 0);

    // Check that dai was transfered to feeController recipient
    assertEq(IERC20(CURVE_SETH_LP).balanceOf(feeRecipient), feeBal - tipAmount);
    assertEq(IERC20(CURVE_SETH_LP).balanceOf(address(keeperIncentive)), tipAmount);
  }
}
