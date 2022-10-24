// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "./Vault.sol";
import { VaultMetadata } from "./VaultsV1Registry.sol";
import "../../utils/Owned.sol";
import "../../interfaces/IContractRegistry.sol";
import "../../interfaces/IRewardsEscrow.sol";
import "./VaultStaking.sol";
import { KeeperConfig } from "../../utils/KeeperIncentivized.sol";
import "../../interfaces/IERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

//TODO create yearn wrapper factory
//TODO create ICloneFactory
/**
 * @notice Factory that deploys VaultStaking
 * @dev deploy can only be called by VaultsV1Controller
 */
contract VaultStakingFactory is Owned {
  /* ========== EVENTS ========== */

  event VaultStakingDeployment(address vaultStaking);
  event StakingImplementationUpdated(address oldStakingImplementation, address newStakingImplementation);

  /* ========== STATE VARIABLES ========== */

  bytes32 public constant contractName = keccak256("VaultStakingFactory");
  address public stakingImplementation;
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
    stakingAddress = Clones.clone(stakingImplementation);

    VaultStaking(stakingAddress).initialize(IERC20(address(vault)), contractRegistry);
    emit VaultStakingDeployment(stakingAddress);
  }

  function setImplementation(address _stakingImplementation) external onlyOwner {
    emit StakingImplementationUpdated(stakingImplementation, _stakingImplementation);
    stakingImplementation = _stakingImplementation;
  }
}
