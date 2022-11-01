// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./Vault.sol";
import { VaultMetadata } from "./VaultsV1Registry.sol";
import "../utils/Owned.sol";
import "../interfaces/IContractRegistry.sol";
import "../interfaces/IRewardsEscrow.sol";
import "./VaultStaking.sol";
import { KeeperConfig } from "../utils/KeeperIncentivized.sol";
import "../interfaces/IERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @notice Factory that deploys VaultStaking
 * @dev deploy can only be called by VaultsV1Controller
 */
contract VaultStakingFactory is Owned {
  /* ========== EVENTS ========== */

  event ImplementationUpdated(address oldImplementation, address newImplementation);
  event VaultStakingDeployment(address vaultStaking);

  /* ========== STATE VARIABLES ========== */

  bytes32 public constant contractName = keccak256("VaultStakingFactory");
  address public implementation;
  IContractRegistry internal contractRegistry;

  /* ========== CONSTRUCTOR ========== */

  constructor(address _owner, IContractRegistry _contractRegistry) Owned(_owner) {
    contractRegistry = _contractRegistry;
  }

  /**
   * @notice Deploys VaultStaking
   * @param vault - address of the vault
   * @dev This should always be called through the VaultV1Controller
   */
  function deploy(address vault) external onlyOwner returns (address stakingAddress) {
    stakingAddress = Clones.clone(implementation);

    VaultStaking(stakingAddress).initialize(IERC20(address(vault)), contractRegistry);
    emit VaultStakingDeployment(stakingAddress);
  }

  function setImplementation(address _stakingImplementation) external onlyOwner {
    emit ImplementationUpdated(implementation, _stakingImplementation);
    implementation = _stakingImplementation;
  }
}
