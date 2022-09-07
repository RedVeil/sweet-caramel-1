// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "./Vault.sol";
import { VaultMetadata } from "./VaultsV1Registry.sol";
import "../../utils/Owned.sol";
import "../../interfaces/IContractRegistry.sol";
import "../../interfaces/IRewardsEscrow.sol";
import "../../dao/Staking.sol";

/**
 * @notice Factory that deploys V1 Vaults
 * @dev deployVaultV1 can only be called by VaultsV1Controller
 */

struct VaultParams {
  address token;
  address yearnRegistry;
  IContractRegistry contractRegistry;
  address staking;
  Vault.FeeStructure feeStructure;
  Vault.KeeperConfig keeperConfig;
}

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
   * @param _vaultParams - struct containing Vault contructor params  (address token_, address yearnRegistry_,
    IContractRegistry contractRegistry_, address staking_, FeeStructure feeStructure_)
    @param _enabled - bool if vault enabled or disabled
    @param _stakingAddress - address of the staking contract for the vault
    @param _metadataCID - ipfs CID of vault metadata
    @param _swapTokenAddresses - array of underlying tokens to recieve LP tokens
    @param _exchange - number that marks exchange
    @dev the submitter in the VaultMetadata is function caller from Controller
   */

  function deployVaultV1(
    VaultParams memory _vaultParams,
    bool _enabled,
    address _stakingAddress,
    address _submitter,
    string memory _metadataCID,
    address[8] memory _swapTokenAddresses,
    address _swapAddress,
    uint256 _exchange
  ) external onlyOwner returns (VaultMetadata memory metadata, address[2] memory contractAddresses) {
    Vault vault = new Vault(
      _vaultParams.token,
      _vaultParams.yearnRegistry,
      _vaultParams.contractRegistry,
      _vaultParams.staking,
      _vaultParams.feeStructure,
      _vaultParams.keeperConfig
    );

    metadata = VaultMetadata({
      vaultAddress: address(vault),
      vaultType: 1,
      enabled: _enabled,
      stakingAddress: _stakingAddress,
      submitter: _submitter,
      metadataCID: _metadataCID,
      swapTokenAddresses: _swapTokenAddresses,
      swapAddress: _swapAddress,
      exchange: _exchange
    });

    Staking staking = new Staking(
      pop,
      IERC20(address(vault)),
      IRewardsEscrow(IContractRegistry(_vaultParams.contractRegistry).getContract(keccak256("RewardsEscrow")))
    );

    contractAddresses = [address(vault), address(staking)];

    emit VaultV1Deployment(address(vault), address(staking));
  }
}
