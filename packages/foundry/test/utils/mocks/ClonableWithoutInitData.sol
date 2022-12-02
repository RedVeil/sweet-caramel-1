pragma solidity ^0.8.15;

import { Initializable } from "openzeppelin-upgradeable/proxy/utils/Initializable.sol";

contract ClonableWithoutInitData is Initializable {
  uint256 val = uint256(10);

  function initialize() public initializer {}
}
