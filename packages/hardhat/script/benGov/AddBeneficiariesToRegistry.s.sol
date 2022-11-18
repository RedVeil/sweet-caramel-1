// SPDX-License-Identifier: AGPL-3.0-only
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import { Script } from "forge-std/Script.sol";
import { BeneficiaryRegistry } from "../../contracts/core/dao/BeneficiaryRegistry.sol";

bytes32 constant DEFAULT_REGION = 0xf2208c967df089f60420785795c0a9ba8896b0f6f1867fa7f1f12ad6f79c1a18; // World

/// @notice Deploys all contracts needed for beneficiary governance and sets the admin functions
/// Beneficiaries:
/// 0 - Nomination Proposal
/// No Takedowns so far

/// 2,3 - Monthly Election
/// 4,5 - Quarterly Election
/// 6,7 - Yearly Election
/// 8-18 - Unused
contract AddBeneficiariesToRegistry is Script {
  BeneficiaryRegistry internal beneficiaryRegistry = BeneficiaryRegistry(0xa8b52Ed2F6605ecDCBaC29d93AbCcd8e9350e1A6);

  string[19] internal cids = [
    "QmSzq4gKUk9LhNNCFBVDbkkz26umqu63jx2dXNABBKcgJ9",
    "QmNY4QEKhnreDZHW3yiphXn765im5y8RCGrySKzRoXDPTB",
    "QmZn2p7xrRxqVGhKAtqjMZSY1Z6pW7A6RD7DiK2xt4nYTB",
    "QmUW6peidPvHtbH4P7VNUpPdfaJqv7nmURbpgMcnzUbTtY",
    "QmVAur87rJCyGh2ja1Pg4smAqD6MzXtuTXxWkeCkKYrf3n",
    "QmNu5LeMyvMkP2sTBZhesXp352ihJUmGTPVeRp42Y9caXJ",
    "QmQ3WQK41BozEznephMEh4cwGsRsFuXjFQRM6himtu5kHq",
    "QmRnnDnHnF8uv1oour3oU9s1GmKNggzdEqMJueZViAvSAa",
    "QmdoFZ6DL49SVmXDBv1zpkCngvr6bU7SUgxLbkh6ZM9L2V",
    "QmchtjJsFDWNzLj93gPND1WhYUUGKeznNR6ATUeuaW71uq",
    "QmYJ8KGfKo5iG8EbxZxvNoWiNuEMM4Hx5ok4paZ1F27G1w",
    "QmTf7c3MaHsBR5rdT5CN3m3yZCuf1XkGxhV81GhJKxempA",
    "QmfQ2Ffxw5P6NoKkQvkRoN31mAd65Dp2UBfPMdgzCDCDDx",
    "QmVNQeMrLpvnizudP9kZquFSb28CmH9fHddEpdX7wyADxF",
    "QmTiSvXRwdGFvPMPtKMurh4FJnzq3bZzws63UuErirSMFq",
    "QmSLS4TKBM2M9tXv5CAdFqUQJ9wR8UjjyhtrUxtbRrXE9M",
    "QmaisZuRUE1ndZGSzmvg4Uxr7nsi2ciQ1z9VoDCnpGRADt",
    "Qmc4qtSHikeYvy4WScJWXtUeX2g3Qf6fC4xoJaU3fugQwu",
    "QmcCmaXA3E8nzcBrTejHHjT8svKh6cSTwhKbPNuRyM6uH5"
  ];

  function run() external {
    uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
    vm.startBroadcast(deployerPrivateKey);

    for (uint256 i = 2; i < 16; i++) {
      beneficiaryRegistry.addBeneficiary(vm.addr(i + 1), DEFAULT_REGION, cids[i]);
    }
    vm.stopBroadcast();
  }
}
