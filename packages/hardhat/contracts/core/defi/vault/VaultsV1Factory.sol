// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

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

  /* ========== STATE VARIABLES ========== */

  IERC20 internal constant pop = IERC20(0xD0Cd466b34A24fcB2f87676278AF2005Ca8A78c4);
  bytes32 public constant contractName = keccak256("VaultsV1Factory");

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
    Vault vault = new Vault(
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
      VaultStaking staking = new VaultStaking(IERC20(address(vault)), _vaultParams.contractRegistry);
      stakingAddress = address(staking);
    }
    contractAddresses = [address(vault), stakingAddress];
    emit VaultV1Deployment(address(vault), stakingAddress);
  }
}
