// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../../contracts/core/utils/ContractRegistry.sol";
import "../../contracts/core/utils/ACLRegistry.sol";
import "../../contracts/core/utils/KeeperIncentiveV2.sol";
import "forge-std/StdJson.sol";
import "forge-std/Test.sol";

// This contract can be used for deployments as well as forge tests
abstract contract DeployScript is Test {
  using stdJson for string;

  address constant ACL_ADMIN = 0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f;

  ContractRegistry public contractRegistry;
  IACLRegistry public aclRegistry;
  KeeperIncentiveV2 public keeperIncentiveV2;

  string root = vm.projectRoot();
  string path = string.concat(root, "/lib/utils/namedAccounts.json");
  string json = vm.readFile(path);

  function instantiateRegistryContracts(bool _forkMainnet) public {
    aclRegistry = ACLRegistry(
      _forkMainnet ? getMainnetContractAddress("aclRegistry") : getHardhatContractAddress("aclRegistry")
    );
    contractRegistry = ContractRegistry(
      _forkMainnet ? getMainnetContractAddress("contractRegistry") : getHardhatContractAddress("contractRegistry")
    );
    keeperIncentiveV2 = KeeperIncentiveV2(
      _forkMainnet ? getMainnetContractAddress("keeperIncentive") : getHardhatContractAddress("keeperIncentive")
    ); //Will we add keeperIncentiveV2 to namedAccounts.json?
  }

  function deployRegistryContracts() public {
    vm.startPrank(ACL_ADMIN);
    aclRegistry = new ACLRegistry();
    contractRegistry = new ContractRegistry(aclRegistry);
    keeperIncentiveV2 = new KeeperIncentiveV2(contractRegistry, 0, 0);
    vm.stopPrank();
  }

  // Make sure you include the --rpc-url for mainnet forking
  function getMainnetContractAddress(string memory _contractKey) public returns (address) {
    string memory fullKey = string.concat(".", _contractKey, ".mainnet");
    return json.readAddress(fullKey);
  } // Should this contract be combined with the hardhat one and we pass in a network variable?

  function getHardhatContractAddress(string memory _contractKey) public returns (address) {
    string memory fullKey = string.concat(".", _contractKey, ".hardhat");
    return json.readAddress(fullKey);
  }

  function grantRole(string memory _role, address _account) public {
    vm.prank(ACL_ADMIN);
    aclRegistry.grantRole(keccak256(abi.encode(_role)), _account);
  }

  function addContract(
    string memory _name,
    address _account,
    string memory _version
  ) public {
    vm.prank(ACL_ADMIN);
    contractRegistry.addContract(keccak256(abi.encode(_name)), _account, keccak256(abi.encode(_version)));
  }

  function createIncentive(
    address _address,
    uint256 _reward,
    bool _enabled,
    bool _openToEveryone,
    address _rewardToken,
    uint256 _cooldown,
    uint256 _burnPercentage
  ) public {
    vm.prank(ACL_ADMIN);
    keeperIncentiveV2.createIncentive(
      _address,
      _reward,
      _enabled,
      _openToEveryone,
      _rewardToken,
      _cooldown,
      _burnPercentage
    );
  }
}
