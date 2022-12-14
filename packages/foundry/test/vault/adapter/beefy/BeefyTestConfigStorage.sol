// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.15;

import { ITestConfigStorage } from "../abstract/ITestConfigStorage.sol";

struct BeefyTestConfig {
  address beefyVault;
  address beefyBooster;
  uint256 withdrawalFee;
}

contract BeefyTestConfigStorage is ITestConfigStorage {
  BeefyTestConfig[] internal testConfigs;

  constructor() {
    // BOMB-BTCB LP
    testConfigs.push(BeefyTestConfig(0x94E85B8E050F3F281CB9597cc0144F1F7AF1fe9B, address(0), 10));
  }

  function getTestConfig(uint256 i) public view returns (bytes memory) {
    return abi.encode(testConfigs[i].beefyVault, testConfigs[i].beefyBooster, testConfigs[i].withdrawalFee);
  }

  function getTestConfigLength() public view returns (uint256) {
    return testConfigs.length;
  }
}
