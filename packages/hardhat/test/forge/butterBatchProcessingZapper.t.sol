// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@ecmendenhall/ds-test/src/test.sol";
import "@ecmendenhall/forge-std/src/Vm.sol";
import { stdCheats } from "@ecmendenhall/forge-std/src/stdlib.sol";

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

struct StdStorage {
  mapping(address => mapping(bytes4 => mapping(bytes32 => uint256))) slots;
  mapping(address => mapping(bytes4 => mapping(bytes32 => bool))) finds;
  bytes32[] _keys;
  bytes4 _sig;
  uint256 _depth;
  address _target;
  bytes32 _set;
}

library stdStorage {
  event SlotFound(address who, bytes4 fsig, bytes32 keysHash, uint256 slot);
  event WARNING_UninitedSlot(address who, uint256 slot);

  Vm private constant vm_std_store = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

  function sigs(string memory sigStr) internal pure returns (bytes4) {
    return bytes4(keccak256(bytes(sigStr)));
  }

  /// @notice find an arbitrary storage slot given a function sig, input data, address of the contract and a value to check against
  // slot complexity:
  //  if flat, will be bytes32(uint256(uint));
  //  if map, will be keccak256(abi.encode(key, uint(slot)));
  //  if deep map, will be keccak256(abi.encode(key1, keccak256(abi.encode(key0, uint(slot)))));
  //  if map struct, will be bytes32(uint256(keccak256(abi.encode(key1, keccak256(abi.encode(key0, uint(slot)))))) + structFieldDepth);
  function find(StdStorage storage self) internal returns (uint256) {
    address who = self._target;
    bytes4 fsig = self._sig;
    uint256 field_depth = self._depth;
    bytes32[] memory ins = self._keys;

    // calldata to test against
    if (self.finds[who][fsig][keccak256(abi.encodePacked(ins, field_depth))]) {
      return self.slots[who][fsig][keccak256(abi.encodePacked(ins, field_depth))];
    }
    bytes memory cald = abi.encodePacked(fsig, flatten(ins));
    vm_std_store.record();
    bytes32 fdat;
    {
      (, bytes memory rdat) = who.staticcall(cald);
      fdat = bytesToBytes32(rdat, 32 * field_depth);
    }

    (bytes32[] memory reads, ) = vm_std_store.accesses(address(who));
    if (reads.length == 1) {
      bytes32 curr = vm_std_store.load(who, reads[0]);
      if (curr == bytes32(0)) {
        emit WARNING_UninitedSlot(who, uint256(reads[0]));
      }
      if (fdat != curr) {
        require(false, "Packed slot. This would cause dangerous overwriting and currently isnt supported");
      }
      emit SlotFound(who, fsig, keccak256(abi.encodePacked(ins, field_depth)), uint256(reads[0]));
      self.slots[who][fsig][keccak256(abi.encodePacked(ins, field_depth))] = uint256(reads[0]);
      self.finds[who][fsig][keccak256(abi.encodePacked(ins, field_depth))] = true;
    } else if (reads.length > 1) {
      for (uint256 i = 0; i < reads.length; i++) {
        bytes32 prev = vm_std_store.load(who, reads[i]);
        if (prev == bytes32(0)) {
          emit WARNING_UninitedSlot(who, uint256(reads[i]));
        }
        // store
        vm_std_store.store(who, reads[i], bytes32(hex"1337"));
        bool success;
        bytes memory rdat;
        {
          (success, rdat) = who.staticcall(cald);
          fdat = bytesToBytes32(rdat, 32 * field_depth);
        }

        if (success && fdat == bytes32(hex"1337")) {
          // we found which of the slots is the actual one
          emit SlotFound(who, fsig, keccak256(abi.encodePacked(ins, field_depth)), uint256(reads[i]));
          self.slots[who][fsig][keccak256(abi.encodePacked(ins, field_depth))] = uint256(reads[i]);
          self.finds[who][fsig][keccak256(abi.encodePacked(ins, field_depth))] = true;
          vm_std_store.store(who, reads[i], prev);
          break;
        }
        vm_std_store.store(who, reads[i], prev);
      }
    } else {
      require(false, "No storage use detected for target");
    }

    require(self.finds[who][fsig][keccak256(abi.encodePacked(ins, field_depth))], "NotFound");

    delete self._target;
    delete self._sig;
    delete self._keys;
    delete self._depth;

    return self.slots[who][fsig][keccak256(abi.encodePacked(ins, field_depth))];
  }

  function target(StdStorage storage self, address _target) internal returns (StdStorage storage) {
    self._target = _target;
    return self;
  }

  function sig(StdStorage storage self, bytes4 _sig) internal returns (StdStorage storage) {
    self._sig = _sig;
    return self;
  }

  function sig(StdStorage storage self, string memory _sig) internal returns (StdStorage storage) {
    self._sig = sigs(_sig);
    return self;
  }

  function with_key(StdStorage storage self, address who) internal returns (StdStorage storage) {
    self._keys.push(bytes32(uint256(uint160(who))));
    return self;
  }

  function with_key(StdStorage storage self, uint256 amt) internal returns (StdStorage storage) {
    self._keys.push(bytes32(amt));
    return self;
  }

  function with_key(StdStorage storage self, bytes32 key) internal returns (StdStorage storage) {
    self._keys.push(key);
    return self;
  }

  function depth(StdStorage storage self, uint256 _depth) internal returns (StdStorage storage) {
    self._depth = _depth;
    return self;
  }

  function checked_write(StdStorage storage self, address who) internal {
    checked_write(self, bytes32(uint256(uint160(who))));
  }

  function checked_write(StdStorage storage self, uint256 amt) internal {
    checked_write(self, bytes32(amt));
  }

  function checked_write(StdStorage storage self, bool write) internal {
    bytes32 t;
    assembly {
      t := write
    }
    checked_write(self, t);
  }

  function checked_write(StdStorage storage self, bytes32 set) internal {
    address who = self._target;
    bytes4 fsig = self._sig;
    uint256 field_depth = self._depth;
    bytes32[] memory ins = self._keys;

    bytes memory cald = abi.encodePacked(fsig, flatten(ins));
    if (!self.finds[who][fsig][keccak256(abi.encodePacked(ins, field_depth))]) {
      find(self);
    }
    bytes32 slot = bytes32(self.slots[who][fsig][keccak256(abi.encodePacked(ins, field_depth))]);

    bytes32 fdat;
    {
      (, bytes memory rdat) = who.staticcall(cald);
      fdat = bytesToBytes32(rdat, 32 * field_depth);
    }
    bytes32 curr = vm_std_store.load(who, slot);

    if (fdat != curr) {
      require(false, "Packed slot. This would cause dangerous overwriting and currently isnt supported");
    }
    vm_std_store.store(who, slot, set);
    delete self._target;
    delete self._sig;
    delete self._keys;
    delete self._depth;
  }

  function bytesToBytes32(bytes memory b, uint256 offset) public pure returns (bytes32) {
    bytes32 out;

    uint256 max = b.length > 32 ? 32 : b.length;
    for (uint256 i = 0; i < max; i++) {
      out |= bytes32(b[offset + i] & 0xFF) >> (i * 8);
    }
    return out;
  }

  function flatten(bytes32[] memory b) private pure returns (bytes memory) {
    bytes memory result = new bytes(b.length * 32);
    for (uint256 i = 0; i < b.length; i++) {
      bytes32 k = b[i];
      assembly {
        mstore(add(result, add(32, mul(32, i))), k)
      }
    }

    return result;
  }
}

contract ButterBatchProcessingZapperTest is DSTest, stdCheats {
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

  Vm public constant vm = Vm(HEVM_ADDRESS);
  uint256 privateKey = 0xBEEF;
  address owner = vm.addr(privateKey);
  using stdStorage for StdStorage;
  StdStorage public std_store_std_cheats;

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

    std_store_std_cheats //change the Usdt address on curve3Pool so it points at our deployed USDT contract
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
