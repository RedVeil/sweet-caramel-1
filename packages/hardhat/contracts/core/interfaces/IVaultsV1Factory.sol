// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "./IVaultsV1.sol";
import "../defi/vault/Vault.sol";
import { VaultMetadata } from "../defi/vault/VaultsV1Registry.sol";
import "../utils/Owned.sol";
import "./IContractRegistry.sol";

interface IVaultsV1Factory {
  /* ========== STRUCTS ========== */
  struct VaultParams {
    address token;
    address yearnRegistry;
    IContractRegistry contractRegistry;
    address staking;
    Vault.FeeStructure feeStructure;
    Vault.KeeperConfig keeperConfig;
  }

  /* ========== FUNCTIONS ========== */
  function deployVaultV1(
    VaultParams memory _vaultParams,
    bool _enabled,
    address _stakingAddress,
    address _submitter,
    string memory _metadataCID,
    address[8] memory _swapTokenAddresses,
    address _swapAddress,
    uint256 _exchange
  ) external returns (VaultMetadata memory, address);
}
