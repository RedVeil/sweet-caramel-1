// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import { Test } from "forge-std/Test.sol";

import "./utils/mocks/MockERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract A {
  event logVal(uint256 val);
  event logVal(address val);

  MockERC20 internal asset;

  constructor(MockERC20 _asset) {
    asset = _asset;
  }

  function delegateCallIncrement(address b, address c) public {
    (bool success, bytes memory result) = b.delegatecall(abi.encodeWithSignature("callIncrement(address)", c));
  }

  function delegateCallAdd(
    address b,
    address c,
    uint256 val
  ) public {
    (bool success, bytes memory result) = b.delegatecall(abi.encodeWithSignature("callAdd(address,uint256)", c, val));
  }

  function delegateCallTransfer(
    address b,
    address c,
    uint256 val
  ) public {
    asset.approve(b, val);
    (bool success, bytes memory result) = b.delegatecall(
      abi.encodeWithSignature("callTransfer(address,uint256)", c, val)
    );
  }

  function delegateCallMint(
    address b,
    address c,
    uint256 val
  ) public {
    (bool success, bytes memory result) = b.delegatecall(abi.encodeWithSignature("callMint(address,uint256)", c, val));
  }
}

contract B {
  event logVal(uint256 val);
  event logVal(address val);

  MockERC20 internal asset;

  constructor(MockERC20 _asset) {
    asset = _asset;
  }

  function callIncrement(address c) public {
    emit logVal(msg.sender);
    emit logVal(C(c).increment());
  }

  function callAdd(address c, uint256 val) public {
    emit logVal(msg.sender);
    emit logVal(C(c).add(val));
  }

  function callTransfer(address c, uint256 val) public {
    emit logVal(msg.sender);
    asset.approve(c, val);
    emit logVal(C(c).transfer(val));
  }

  function callMint(address c, uint256 val) public {
    emit logVal(msg.sender);
    emit logVal(C(c).mint(val));
  }
}

contract C is ERC20 {
  event logVal(uint256 val);
  event logVal(address val);

  uint256 public counter;
  mapping(address => uint256) public virtualBalances;

  MockERC20 internal asset;

  constructor(MockERC20 _asset) ERC20("C", "c") {
    asset = _asset;
  }

  function increment() public returns (uint256) {
    emit logVal(msg.sender);
    emit logVal(counter);
    counter++;
    return counter;
  }

  function add(uint256 val) public returns (uint256) {
    emit logVal(msg.sender);
    emit logVal(val);
    virtualBalances[msg.sender] += val;
    return virtualBalances[msg.sender];
  }

  function transfer(uint256 val) public returns (uint256) {
    emit logVal(msg.sender);
    emit logVal(val);
    asset.transferFrom(msg.sender, address(this), val);
    return val;
  }

  function mint(uint256 val) public returns (uint256) {
    emit logVal(msg.sender);
    emit logVal(val);
    _mint(msg.sender, val);
    return val;
  }
}

contract SampleDelegationTest is Test {
  MockERC20 asset;

  A a;
  B b;
  C c;

  function setUp() public {
    asset = new MockERC20("a", "a", 18);

    a = new A(asset);
    b = new B(asset);
    c = new C(asset);
  }

  function test__delegateCallIncrement() public {
    a.delegateCallIncrement(address(b), address(c));
    a.delegateCallIncrement(address(b), address(c));
    a.delegateCallIncrement(address(b), address(c));
  }

  function test__delegateCallAdd() public {
    a.delegateCallAdd(address(b), address(c), 10);
    a.delegateCallAdd(address(b), address(c), 50);
    a.delegateCallAdd(address(b), address(c), 20);
  }

  function test__delegateCallTransfer() public {
    asset.mint(address(a), 80);
    a.delegateCallTransfer(address(b), address(c), 10);
    a.delegateCallTransfer(address(b), address(c), 50);
    a.delegateCallTransfer(address(b), address(c), 20);

    emit log_named_uint("asset bal C", asset.balanceOf(address(c)));
  }

  function test__delegateCallMint() public {
    a.delegateCallMint(address(b), address(c), 10);
    a.delegateCallMint(address(b), address(c), 50);
    a.delegateCallMint(address(b), address(c), 20);

    emit log_named_uint("C bal A", c.balanceOf(address(a)));
    emit log_named_uint("C bal B", c.balanceOf(address(b)));
  }
}
