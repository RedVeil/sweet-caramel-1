// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import { Clones } from "@openzeppelin/contracts/proxy/Clones.sol";
import { Owned } from "../../../utils/Owned.sol";
import { VaultAPI } from "../../../interfaces/external/yearn/IVaultAPI.sol";
import { YearnWrapper } from "./YearnWrapper.sol";

/**
 * @notice Factory that deploys YearnWrappers
 * @dev deploy can only be called by VaultsV1Controller
 */
contract YearnWrapperFactory is Owned {
  /* ========== EVENTS ========== */

  event ImplementationUpdated(address oldImplementation, address newImplementation);
  event YearnWrapperDeployment(address yearnWrapper);

  /* ========== STATE VARIABLES ========== */

  bytes32 public constant contractName = keccak256("YearnWrapperFactory");
  address public implementation;

  /* ========== CONSTRUCTOR ========== */

  constructor(address _owner) Owned(_owner) {}

  /**
   * @notice Deploys YearnWrapper
   * @param vault - address of the underlying yearn vault
   * @dev This should always be called through the VaultV1Controller
   */
  function deploy(address vault) external onlyOwner returns (address wrapperAddress) {
    wrapperAddress = Clones.clone(implementation);

    YearnWrapper(wrapperAddress).initialize(VaultAPI(vault));
    emit YearnWrapperDeployment(wrapperAddress);
  }

  function setImplementation(address _implementation) external onlyOwner {
    emit ImplementationUpdated(implementation, _implementation);
    implementation = _implementation;
  }
}
