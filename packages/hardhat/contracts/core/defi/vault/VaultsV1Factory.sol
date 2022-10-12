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

struct VaultParams {
  address token;
  address yearnRegistry;
  IContractRegistry contractRegistry;
  address staking;
  address zapper;
  Vault.FeeStructure feeStructure;
  KeeperConfig keeperConfig;
}

/**
 * @notice Factory that deploys V1 Vaults
 * @dev deployVaultV1 can only be called by VaultsV1Controller
 */
contract VaultsV1Factory is Owned {
  /* ========== EVENTS ========== */

  event VaultV1Deployment(address vault, address vaultStaking);
  event VaultImplementationUpdated(address oldVaultImplementation, address newVaultImplementation);
  event StakingImplementationUpdated(address oldStakingImplementation, address newStakingImplementation);

  /* ========== STATE VARIABLES ========== */

  IERC20 internal constant pop = IERC20(0xD0Cd466b34A24fcB2f87676278AF2005Ca8A78c4);
  bytes32 public constant contractName = keccak256("VaultsV1Factory");
  address public vaultImplementation;
  address public stakingImplementation;

  /* ========== CONSTRUCTOR ========== */

  constructor(address _owner) Owned(_owner) {}

  /**
   * @notice Deploys V1 Vault
   * @param _vaultParams - struct containing Vault contructor params
   * @dev This should always be called through the VaultV1Controller
   */
  function deployVaultV1(VaultParams memory _vaultParams)
    external
    onlyOwner
    returns (address[2] memory contractAddresses)
  {
    address vault = Clones.clone(vaultImplementation);
    Vault(vault).initialize(
      _vaultParams.token,
      _vaultParams.yearnRegistry,
      _vaultParams.contractRegistry,
      _vaultParams.staking,
      _vaultParams.zapper,
      _vaultParams.feeStructure,
      _vaultParams.keeperConfig
    );

    address stakingAddress = _vaultParams.staking;
    if (stakingAddress == address(0)) {
      stakingAddress = Clones.clone(stakingImplementation);

      VaultStaking(stakingAddress).initialize(IERC20(address(vault)), _vaultParams.contractRegistry);
    }
    contractAddresses = [vault, stakingAddress];
    emit VaultV1Deployment(vault, stakingAddress);
  }

  function setVaultImplementation(address _vaultImplementation) external onlyOwner {
    emit VaultImplementationUpdated(vaultImplementation, _vaultImplementation);
    vaultImplementation = _vaultImplementation;
  }

  function setStakingImplementation(address _stakingImplementation) external onlyOwner {
    emit StakingImplementationUpdated(stakingImplementation, _stakingImplementation);
    stakingImplementation = _stakingImplementation;
  }
}
