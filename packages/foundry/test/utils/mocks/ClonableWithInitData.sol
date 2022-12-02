pragma solidity ^0.8.15;

import { Initializable } from "openzeppelin-upgradeable/proxy/utils/Initializable.sol";

contract ClonableWithInitData is Initializable {
  uint256 val;

  function initialize(uint256 _val) public initializer {
    val = _val;
  }
}
