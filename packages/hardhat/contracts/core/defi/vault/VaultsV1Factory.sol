// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "./Vault.sol";
import { VaultMetadata } from "./VaultsV1Registry.sol";
import "../../utils/Owned.sol";
import "../../interfaces/IContractRegistry.sol";

/**
 * @notice Factory that deploys V1 Vaults
 * @dev deployVaultV1 can only be called by VaultsV1Controller
 */

struct VaultParams {
  address token;
  address yearnRegistry;
  IContractRegistry contractRegistry;
  address staking;
  uint256 keeperVigBps;
  Vault.FeeStructure feeStructure;
}

contract VaultsV1Factory is Owned {
  /* ========== EVENTS ========== */

  event VaultV1Deployment(address vaultAddress);

  /* ========== STATE VARIABLES ========== */

  bytes32 public constant contractName = keccak256("VaultsV1Factory");

  /* ========== CONSTRUCTOR ========== */

  constructor(address _owner) Owned(_owner) {}

  /**
   * @notice Deploys V1 Vault
   * @param _vaultParams - struct containing Vault contructor params  (address token_, address yearnRegistry_,
    IContractRegistry contractRegistry_, address staking_, uint256 keeperVigBps, Vault.FeeStructure feeStructure_)
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
  ) external onlyOwner returns (VaultMetadata memory, address) {
    Vault vault = new Vault(
      _vaultParams.token,
      _vaultParams.yearnRegistry,
      _vaultParams.contractRegistry,
      _vaultParams.staking,
      _vaultParams.keeperVigBps,
      _vaultParams.feeStructure
    );
    VaultMetadata memory metadata = VaultMetadata({
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

    emit VaultV1Deployment(address(vault));
    return (metadata, address(vault));
  }
}
