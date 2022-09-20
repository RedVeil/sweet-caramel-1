// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../test/forge/DeployScript.sol";

contract DeployPop is DeployScript {
  function run() external {
    deployRegistryContracts();
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    vm.startBroadcast(deployerPrivateKey);

    ERC20 POP = new ERC20("Popcorn", "TPOP");

    vm.stopBroadcast();

    grantRole("DAO", address(POP));
  }
}
