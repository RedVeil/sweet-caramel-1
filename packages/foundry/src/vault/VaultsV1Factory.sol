// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "openzeppelin-contracts/proxy/Clones.sol";
import "openzeppelin-contracts/token/ERC20/ERC20.sol";
import "../utils/Owned.sol";
import "./Vault.sol";
import { KeeperConfig } from "../utils/KeeperIncentivized.sol";
import "../interfaces/IContractRegistry.sol";
import "../interfaces/IRewardsEscrow.sol";
import "../interfaces/IERC4626.sol";

struct VaultParams {
  ERC20 asset;
  IERC4626 strategy;
  IContractRegistry contractRegistry;
  Vault.FeeStructure feeStructure;
  KeeperConfig keeperConfig;
}

/**
 * @notice Factory that deploys V1 Vaults
 * @dev deploy can only be called by VaultsV1Controller
 */
contract VaultsV1Factory is Owned {
  /* ========== EVENTS ========== */

  event ImplementationUpdated(address oldImplementation, address newImplementation);
  event VaultV1Deployment(address vault);

  /* ========== STATE VARIABLES ========== */

  bytes32 public constant contractName = keccak256("VaultsV1Factory");
  address public implementation;

  /* ========== CONSTRUCTOR ========== */

  constructor(address _owner) Owned(_owner) {}

  // TODO make factory contracts generic so they can be used for any strategy/vault/staking
  // NOTE implementation will be passed in by user
  /**
   * @notice Deploys V1 Vault
   * @param _vaultParams - struct containing Vault contructor params
   * @dev This should always be called through the VaultV1Controller
   */
  function deploy(VaultParams memory _vaultParams) external onlyOwner returns (address vault) {
    vault = Clones.clone(implementation);
    Vault(vault).initialize(
      _vaultParams.asset,
      _vaultParams.strategy,
      _vaultParams.contractRegistry,
      _vaultParams.feeStructure,
      _vaultParams.keeperConfig
    );
    emit VaultV1Deployment(vault);
  }

  function setImplementation(address _vaultImplementation) external onlyOwner {
    emit ImplementationUpdated(implementation, _vaultImplementation);
    implementation = _vaultImplementation;
  }
}
