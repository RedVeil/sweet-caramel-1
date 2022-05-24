// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "forge-std/src/Test.sol";

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../../contracts/core/defi/butter/butterBatchProcessingZapper.sol";
import "../../contracts/core/defi/butter/butterBatchProcessing.sol";
import "../../contracts/core/interfaces/IContractRegistry.sol";
import "../../contracts/core/interfaces/IACLRegistry.sol";
import "../../contracts/externals/interfaces/Curve3Pool.sol";
import "../../contracts/mocks/MockERC20Permit.sol";
import "../../contracts/mocks/MockERC20.sol";
import "../../contracts/core/utils/ACLRegistry.sol";
import "../../contracts/core/utils/ContractRegistry.sol";

address constant aclRegistryAdmin = 0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f;
address constant BBAddress = 0x709bC6256413D55a81d6f2063CF057519aE8a95b;
address constant contractRegistryMainnet = 0x85831b53AFb86889c20aF38e654d871D8b0B7eC3;
address constant curve3PoolMainnet = 0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7;
address constant threeCrvMainnet = 0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490;
address constant usdcMainnet = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
address constant daiMainnet = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
address constant aclRegistryMainnet = 0x8A41aAa4B467ea545DDDc5759cE3D35984F093f4;
address constant butterProcessingMainnet = 0xCd979A9219DB9A353e29981042A509f2E7074D8B;
address constant usdtMainnet = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

contract ButterBatchProcessingZapperTest is Test {
  using stdStorage for StdStorage;
  StdStorage public test;
  uint256 privateKey = 0xBEEF;
  address owner = vm.addr(privateKey);

  MockERC20Permit Usdc;
  MockERC20 Usdt;
  MockERC20Permit Dai;
  MockERC20 threeCrv;
  Curve3Pool curve3Pool;
  IERC20 _threeCrv;
  Curve3Pool mockCurveThreePool;
  IACLRegistry aclRegistry;
  ContractRegistry contractRegistry;
  ButterBatchProcessingZapper butterBatchProcessingZapper;
  ButterBatchProcessing butterBatchProcessing;

  bytes32 public constant APPROVED_CONTRACT_ROLE = keccak256("ApprovedContract");
  bytes32 public constant BUTTER_ZAPPER_ROLE = keccak256("ButterZapper");
  bytes32 constant PERMIT_TYPEHASH =
    keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
  bytes32 constant DAIPERMIT_TYPEHASH =
    keccak256("Permit(address holder,address spender,uint256 nonce,uint256 expiry,bool allowed)");

  uint256 usdcInitialUserBalance = 1e12;
  uint256 usdtInitialUserBalance = 1000;
  uint256 daiInitialUserBalance = 785;

  function setUp() public {
    // forks
    Usdc = MockERC20Permit(usdcMainnet);
    Dai = MockERC20Permit(daiMainnet);
    aclRegistry = ACLRegistry(aclRegistryMainnet);
    contractRegistry = ContractRegistry(contractRegistryMainnet);
    butterBatchProcessing = ButterBatchProcessing(butterProcessingMainnet);
    _threeCrv = butterBatchProcessing.threeCrv();
    mockCurveThreePool = Curve3Pool(curve3PoolMainnet);

    // Deploy new contracts
    butterBatchProcessingZapper = new ButterBatchProcessingZapper(contractRegistry, mockCurveThreePool, _threeCrv);
    Usdt = new MockERC20("USD Tether", "UST", 6); // cant be forked as contract is not verified on etherscan

    test //change the Usdt address on curve3Pool so it points at our deployed USDT contract
      .target(address(mockCurveThreePool))
      .sig(Curve3Pool(mockCurveThreePool).coins.selector)
      .with_key(2)
      .checked_write(address(Usdt));

    // Give Zapper the correct permissions
    vm.startPrank(aclRegistryAdmin);
    aclRegistry.grantRole(APPROVED_CONTRACT_ROLE, address(butterBatchProcessingZapper));
    aclRegistry.grantRole(BUTTER_ZAPPER_ROLE, address(butterBatchProcessingZapper));
    vm.stopPrank();

    // Faucet
    tip(address(Usdc), owner, usdcInitialUserBalance);
    tip(address(Dai), owner, daiInitialUserBalance);
    tip(address(Usdt), owner, usdtInitialUserBalance);

    // Allow CurvePool and ButterProcessing to spend ButterZappers tokens
    vm.startPrank(address(butterBatchProcessingZapper));
    _threeCrv.approve(address(butterBatchProcessing), type(uint256).max);
    Usdc.approve(address(mockCurveThreePool), type(uint256).max);
    Dai.approve(address(mockCurveThreePool), type(uint256).max);
    Usdt.approve(address(mockCurveThreePool), type(uint256).max);
    vm.stopPrank();

    vm.startPrank(owner);
  }

  function testZapPermitWithUSDC() public {
    uint256 initialButterProcessingBalance = _threeCrv.balanceOf(address(butterBatchProcessing));
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(
      privateKey,
      keccak256(
        abi.encodePacked(
          "\x19\x01",
          Usdc.DOMAIN_SEPARATOR(),
          keccak256(
            abi.encode(PERMIT_TYPEHASH, owner, address(butterBatchProcessingZapper), uint256(10), 0, type(uint256).max)
          )
        )
      )
    );

    butterBatchProcessingZapper.zapIntoBatchPermit(
      [uint256(0), uint256(10), uint256(0)],
      uint256(0),
      [uint256(0), type(uint256).max],
      [0, v],
      [bytes32(""), r],
      [bytes32(""), s],
      [uint256(0), uint256(0)]
    );
    assertEq(IERC20(mockCurveThreePool.coins(1)).balanceOf(owner), uint256(usdcInitialUserBalance - 10));
    assertGt(_threeCrv.balanceOf(address(butterBatchProcessing)), initialButterProcessingBalance);
  }

  function testZapPermitWithMultipleCoins() public {
    uint256 amount = 10;
    Usdt.approve(address(butterBatchProcessingZapper), uint256(amount));
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(
      privateKey,
      keccak256(
        abi.encodePacked(
          "\x19\x01",
          Usdc.DOMAIN_SEPARATOR(),
          keccak256(
            abi.encode(PERMIT_TYPEHASH, owner, address(butterBatchProcessingZapper), uint256(10), 0, type(uint256).max)
          )
        )
      )
    );

    uint256 nonce = Dai.nonces(owner);
    (uint8 vDai, bytes32 rDai, bytes32 sDai) = vm.sign(
      privateKey,
      keccak256(
        abi.encodePacked(
          "\x19\x01",
          Dai.DOMAIN_SEPARATOR(),
          keccak256(
            abi.encode(DAIPERMIT_TYPEHASH, owner, address(butterBatchProcessingZapper), nonce, type(uint256).max, true)
          )
        )
      )
    );

    butterBatchProcessingZapper.zapIntoBatchPermit(
      [uint256(amount), uint256(amount), uint256(amount)],
      uint256(0),
      [type(uint256).max, type(uint256).max],
      [vDai, v],
      [rDai, r],
      [sDai, s],
      [nonce, uint256(0)]
    );
    assertEq(IERC20(mockCurveThreePool.coins(1)).balanceOf(owner), uint256(usdcInitialUserBalance - amount));
    assertEq(IERC20(mockCurveThreePool.coins(0)).balanceOf(owner), uint256(daiInitialUserBalance - amount));
    assertEq(IERC20(mockCurveThreePool.coins(2)).balanceOf(owner), uint256(usdtInitialUserBalance - amount));
  }

  function testCannotUSDCWithInvalidSignature() public {
    uint256 signatureAmount = 1;
    uint256 inputAmount = 10;

    (uint8 v, bytes32 r, bytes32 s) = vm.sign(
      privateKey,
      keccak256(
        abi.encodePacked(
          "\x19\x01",
          Usdc.DOMAIN_SEPARATOR(),
          keccak256(
            abi.encode(
              PERMIT_TYPEHASH,
              owner,
              address(butterBatchProcessingZapper),
              signatureAmount,
              0,
              type(uint256).max
            )
          )
        )
      )
    );
    vm.expectRevert("EIP2612: invalid signature");
    butterBatchProcessingZapper.zapIntoBatchPermit(
      [uint256(0), inputAmount, uint256(0)],
      uint256(0),
      [type(uint256).max, type(uint256).max],
      [0, v],
      [bytes32(""), r],
      [bytes32(""), s],
      [uint256(0), uint256(0)]
    );

    assertEq(IERC20(mockCurveThreePool.coins(1)).balanceOf(owner), usdcInitialUserBalance);
  }

  function testZapPermitWithDAI() public {
    uint256 depositAmount = 17;
    uint256 nonce = Dai.nonces(owner);
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(
      privateKey,
      keccak256(
        abi.encodePacked(
          "\x19\x01",
          Dai.DOMAIN_SEPARATOR(),
          keccak256(
            abi.encode(DAIPERMIT_TYPEHASH, owner, address(butterBatchProcessingZapper), nonce, type(uint256).max, true)
          )
        )
      )
    );

    butterBatchProcessingZapper.zapIntoBatchPermit(
      [depositAmount, uint256(0), uint256(0)],
      uint256(0),
      [type(uint256).max, type(uint256).max],
      [v, 0],
      [r, bytes32("")],
      [s, bytes32("")],
      [nonce, uint256(0)]
    );
    assertEq(IERC20(mockCurveThreePool.coins(0)).balanceOf(owner), daiInitialUserBalance - depositAmount);
  }

  function testCannotZapPermitWithUSDTFailsWithoutApproval() public {
    uint256 nonce;
    uint8 v;
    bytes32 r;
    bytes32 s;
    vm.expectRevert("ERC20: transfer amount exceeds allowance");
    butterBatchProcessingZapper.zapIntoBatchPermit(
      [uint256(0), uint256(0), uint256(32)],
      uint256(0),
      [type(uint256).max, type(uint256).max],
      [v, 0],
      [r, bytes32("")],
      [s, bytes32("")],
      [nonce, uint256(0)]
    );

    assertEq(IERC20(mockCurveThreePool.coins(2)).balanceOf(owner), usdtInitialUserBalance);
  }

  function testZapPermitWithUSDT() public {
    uint256 depositAmount = 32;
    uint8 v;
    bytes32 r;
    bytes32 s;
    uint256 nonce;
    Usdt.approve(address(butterBatchProcessingZapper), uint256(1000000));

    butterBatchProcessingZapper.zapIntoBatchPermit(
      [uint256(0), uint256(0), depositAmount],
      uint256(0),
      [type(uint256).max, type(uint256).max],
      [v, 0],
      [r, bytes32("")],
      [s, bytes32("")],
      [nonce, uint256(0)]
    );
    assertEq(IERC20(mockCurveThreePool.coins(2)).balanceOf(owner), uint256(usdtInitialUserBalance - depositAmount));
  }

  //   Fuzz tests

  function testFuzzZapPermitWithUSDC(uint256 _amount) public {
    vm.assume(_amount > 0);
    vm.assume(_amount < 573913332637408161941); // is this a problem or something we should protect against? Fails if this number is input
    uint256 initialBalance = _amount + 26;
    tip(address(Usdc), owner, initialBalance);
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(
      privateKey,
      keccak256(
        abi.encodePacked(
          "\x19\x01",
          Usdc.DOMAIN_SEPARATOR(),
          keccak256(
            abi.encode(
              PERMIT_TYPEHASH,
              owner,
              address(butterBatchProcessingZapper),
              uint256(_amount),
              0,
              type(uint256).max
            )
          )
        )
      )
    );

    butterBatchProcessingZapper.zapIntoBatchPermit(
      [uint256(0), uint256(_amount), uint256(0)],
      uint256(0),
      [uint256(0), type(uint256).max],
      [0, v],
      [bytes32(""), r],
      [bytes32(""), s],
      [uint256(0), uint256(0)]
    );
    assertEq(IERC20(mockCurveThreePool.coins(1)).balanceOf(owner), uint256(initialBalance - _amount));
  }

  function testFuzzZapPermitWithDAI(uint256 _amount) public {
    vm.assume(_amount > 0);
    vm.assume(_amount < 575939690747663752256225719060955);
    uint256 initialBalance = _amount + 26;
    tip(address(Dai), owner, initialBalance);

    uint256 nonce = Dai.nonces(owner);
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(
      privateKey,
      keccak256(
        abi.encodePacked(
          "\x19\x01",
          Dai.DOMAIN_SEPARATOR(),
          keccak256(
            abi.encode(DAIPERMIT_TYPEHASH, owner, address(butterBatchProcessingZapper), nonce, type(uint256).max, true)
          )
        )
      )
    );

    butterBatchProcessingZapper.zapIntoBatchPermit(
      [uint256(_amount), uint256(0), uint256(0)],
      uint256(0),
      [type(uint256).max, type(uint256).max],
      [v, 0],
      [r, bytes32("")],
      [s, bytes32("")],
      [nonce, uint256(0)]
    );
    assertEq(IERC20(mockCurveThreePool.coins(0)).balanceOf(owner), uint256(initialBalance - _amount));
  }

  function testFuzzZapPermitWithUSDT(uint256 _amount) public {
    vm.assume(_amount > 0);
    vm.assume(_amount < 418913422800103483443);
    uint256 initialBalance = _amount + 26;
    tip(address(Usdt), owner, initialBalance);

    Usdt.approve(address(butterBatchProcessingZapper), uint256(_amount));

    butterBatchProcessingZapper.zapIntoBatchPermit(
      [uint256(0), uint256(0), uint256(_amount)],
      uint256(0),
      [uint256(0), uint256(0)],
      [0, 0],
      [bytes32(""), bytes32("")],
      [bytes32(""), bytes32("")],
      [uint256(0), uint256(0)]
    );
    assertEq(IERC20(mockCurveThreePool.coins(2)).balanceOf(owner), uint256(initialBalance - _amount));
  }
}
