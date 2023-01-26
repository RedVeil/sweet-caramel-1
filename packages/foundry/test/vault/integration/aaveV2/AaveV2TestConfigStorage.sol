// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.15

pragma solidity ^0.8.15;

import { ITestConfigStorage } from "../abstract/ITestConfigStorage.sol";

struct AaveV2TestConfig {
  address aToken;
}

contract AaveV2TestConfigStorage is ITestConfigStorage {
  AaveV2TestConfig[] internal testConfigs;

  constructor() {
    // Polygon - wETH aToken
    testConfigs.push(AaveV2TestConfig(0x28424507fefb6f7f8E9D3860F56504E4e5f5f390));
  }

  function getTestConfig(uint256 i) public view returns (bytes memory) {
    return abi.encode(testConfigs[i].aToken);
  }

  function getTestConfigLength() public view returns (uint256) {
    return testConfigs.length;
  }
}
