// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import { Owned } from "../utils/Owned.sol";
import { IKeeperIncentiveV2 } from "../interfaces/IKeeperIncentiveV2.sol";
import { KeeperConfig } from "../utils/KeeperIncentivized.sol";
import { IVault, VaultParams, FeeStructure } from "../interfaces/vault/IVault.sol";
import { IMultiRewardsStaking } from "../interfaces/IMultiRewardsStaking.sol";
import { IMultiRewardsEscrow } from "../interfaces/IMultiRewardsEscrow.sol";
import { IDeploymentController } from "../interfaces/vault/IDeploymentController.sol";
import { Template } from "../interfaces/vault/ITemplateRegistry.sol";
import { IEndorsementRegistry } from "../interfaces/vault/IEndorsementRegistry.sol";
import { IVaultsRegistry, VaultMetadata } from "../interfaces/vault/IVaultsRegistry.sol";
import { IAdminProxy } from "../interfaces/vault/IAdminProxy.sol";
import { IERC4626, IERC20 } from "../interfaces/vault/IERC4626.sol";
import { IStrategy } from "../interfaces/vault/IStrategy.sol";
import { IAdapter } from "../interfaces/vault/IAdapter.sol";
import { IPausable } from "../interfaces/IPausable.sol";

contract VaultsController is Owned {
  /*//////////////////////////////////////////////////////////////
                               IMMUTABLES
    //////////////////////////////////////////////////////////////*/

  IDeploymentController public deploymentController;
  IEndorsementRegistry public endorsementRegistry;
  IVaultsRegistry public vaultsRegistry;
  IKeeperIncentiveV2 public keeperIncentive;

  bytes32 public immutable VAULT = "Vault";
  bytes32 public immutable ADAPTER = "Adapter";
  bytes32 public immutable STRATEGY = "Strategy";
  bytes32 public immutable STAKING = "Staking";
  bytes4 internal immutable DEPLOY_SIG = bytes4(keccak256("deploy(bytes32,bytes32,bytes)")); // TODO just store the hash

  constructor(
    address _owner,
    IAdminProxy _adminProxy,
    IDeploymentController _deploymentController,
    IEndorsementRegistry _endorsementRegistry,
    IVaultsRegistry _vaulsRegistry,
    IKeeperIncentiveV2 _keeperIncentive,
    IMultiRewardsEscrow _escrow
  )
    Owned(_owner) // can change
  //TODO which of these might we want to update?
  {
    adminProxy = _adminProxy; // cant change
    deploymentController = _deploymentController; // can change -- If we want to add capabilities or switch the factory
    endorsementRegistry = _endorsementRegistry; // cant change
    vaultsRegistry = _vaulsRegistry; // cant change
    keeperIncentive = _keeperIncentive; // can/cant change ?
    escrow = _escrow; // cant change
  }

  /*//////////////////////////////////////////////////////////////
                          DEPLOYMENT LOGIC
    //////////////////////////////////////////////////////////////*/
  error MisConfig();
  error AssetNotEndorsed(IERC20 asset);

  event VaultDeployed(address indexed vault, address indexed staking, address indexed adapter);

  struct DeploymentArgs {
    /// @Notice templateId
    bytes32 id;
    /// @Notice encoded init params
    bytes data;
  }

  function deployVault(
    DeploymentArgs memory strategyData,
    DeploymentArgs memory adapterData,
    bytes memory rewardsData,
    VaultParams memory vaultData,
    VaultMetadata memory metadata,
    bytes memory addKeeperData
  ) external onlyOwner returns (address vault) {
    IERC20 asset = vaultData.asset;
    IDeploymentController _deploymentController = deploymentController;
    if (!endorsementRegistry.endorsed(address(asset))) revert AssetNotEndorsed(asset);
    if (address(vaultData.adapter) != address(0)) {
      if (adapterData.id > 0) revert MisConfig();
      if (!_deploymentController.cloneExists(address(vaultData.adapter))) revert MisConfig();
    }

    if (adapterData.id.length > 0)
      vaultData.adapter = IERC4626(_deployStrategyAndAdapter(strategyData, adapterData, asset, _deploymentController));

    vault = _deployVault(vaultData, _deploymentController);

    address staking = _deployStaking(asset, _deploymentController);

    if (rewardsData.length > 0) {
      address[] memory stakingContracts = new address[](1);
      stakingContracts[0] = staking;
      bytes[] memory rewardsDatas = new bytes[](1);
      rewardsDatas[0] = rewardsData;
      addRewardsToken(stakingContracts, rewardsDatas);
    }

    _handleKeeperSetup(vault, vaultData.keeperConfig, addKeeperData);

    _registerVault(vault, staking, metadata);

    emit VaultDeployed(vault, staking, address(vaultData.adapter));
  }

  function _deployVault(
    VaultParams memory vaultData,
    IDeploymentController deploymentController
  ) internal returns (address vault) {
    vaultData.owner = address(adminProxy);
    vaultData.keeperIncentive = keeperIncentive;

    (bool success, bytes memory returnData) = adminProxy.execute(
      address(deploymentController),
      abi.encodeWithSelector(
        DEPLOY_SIG,
        VAULT,
        "V1", // TODO should this be set in state?
        abi.encodeWithSelector(IVault.initialize.selector, abi.encode(vaultData))
      )
    );
    vault = abi.decode(returnData, (address));
  }

  function deployStrategyAndAdapter(
    DeploymentArgs memory strategyData,
    DeploymentArgs memory adapterData,
    IERC20 asset
  ) public onlyOwner returns (address) {
    if (!endorsementRegistry.endorsed(address(asset))) revert AssetNotEndorsed(asset);

    return _deployStrategyAndAdapter(strategyData, adapterData, asset, deploymentController);
  }

  function _deployStrategyAndAdapter(
    DeploymentArgs memory strategyData,
    DeploymentArgs memory adapterData,
    IERC20 asset,
    IDeploymentController deploymentController
  ) internal returns (address adapter) {
    bytes memory baseAdapterData = _deployStrategy(strategyData, asset);

    (bool success, bytes memory returnDataAdapter) = adminProxy.execute(
      address(deploymentController),
      abi.encodeWithSelector(
        DEPLOY_SIG,
        ADAPTER,
        adapterData.id,
        abi.encodeWithSelector(IAdapter.initialize.selector, baseAdapterData, adapterData.data)
      )
    );
    adapter = abi.decode(returnDataAdapter, (address));

    adminProxy.execute(adapter, abi.encodeWithSelector(IAdapter.setManagementFee.selector, managementFee));
  }

  function _deployStrategy(DeploymentArgs memory strategyData, IERC20 asset) internal returns (bytes memory) {
    address strategy;
    bytes4[8] memory requiredSigs;
    if (strategyData.id.length > 0) {
      (bool success, bytes memory returnDataStrategy) = adminProxy.execute(
        address(deploymentController),
        abi.encodeWithSelector(DEPLOY_SIG, STRATEGY, strategyData.id, "")
      );
      strategy = abi.decode(returnDataStrategy, (address));
      Template memory strategyTemplate = deploymentController.getTemplate(STRATEGY, strategyData.id);
      requiredSigs = strategyTemplate.requiredSigs;
    }
    return
      abi.encode(asset, address(adminProxy), IStrategy(strategy), requiredSigs, strategyData.data, harvestCooldown);
  }

  function deployStaking(IERC20 asset) public onlyOwner returns (address) {
    if (!endorsementRegistry.endorsed(address(asset))) revert AssetNotEndorsed(asset);
    return _deployStaking(asset, deploymentController);
  }

  function _deployStaking(IERC20 asset, IDeploymentController deploymentController) internal returns (address staking) {
    (bool success, bytes memory returnData) = adminProxy.execute(
      address(deploymentController),
      abi.encodeWithSelector(
        DEPLOY_SIG,
        STAKING,
        "MultiRewardsStaking", // TODO should this be set in state?
        abi.encodeWithSelector(IMultiRewardsStaking.initialize.selector, asset, escrow, adminProxy)
      )
    );
    staking = abi.decode(returnData, (address));
  }

  /**
   * @notice sets keeperConfig and creates incentive for new vault deployment
   * @dev avoids stack too deep in deployVaultFromFactory
   */
  function _handleKeeperSetup(address _vault, KeeperConfig memory _keeperConfig, bytes memory addKeeperData) internal {
    (bool _keeperEnabled, bool _keeperOpenToEveryone, uint256 _keeperCooldown) = abi.decode(
      addKeeperData,
      (bool, bool, uint256)
    );
    adminProxy.execute(_vault, abi.encodeWithSelector(IVault.setKeeperConfig.selector, abi.encode(_keeperConfig)));
    adminProxy.execute(
      address(keeperIncentive),
      abi.encodeWithSelector(
        IKeeperIncentiveV2.createIncentive.selector,
        _vault,
        _keeperConfig.keeperPayout,
        _keeperEnabled,
        _keeperOpenToEveryone,
        _vault,
        _keeperCooldown,
        uint256(0)
      )
    );
  }

  function _registerVault(address vault, address staking, VaultMetadata memory metadata) internal {
    metadata.vaultAddress = vault;
    metadata.staking = staking;
    metadata.submitter = msg.sender;

    adminProxy.execute(
      address(vaultsRegistry),
      abi.encodeWithSelector(IVaultsRegistry.registerVault.selector, abi.encode(metadata))
    );
  }

  /*//////////////////////////////////////////////////////////////
                          VAULT MANAGEMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  /**
   * @notice Propose a new Adapter.
   * @param vaults - addresses of the vaults
   * @param newAdapter - new strategies to be proposed for the vault
   * @dev index of _vaults array and _newStrategies array must coincide
   */
  function proposeVaultAdapter(address[] memory vaults, IERC4626[] memory newAdapter) external {
    IDeploymentController _deploymentController = deploymentController;
    uint8 len = uint8(vaults.length);
    for (uint8 i = 0; i < len; i++) {
      _verifySubmitter(vaults[i]);
      _deploymentController.cloneExists(address(newAdapter[i]));
      adminProxy.execute(vaults[i], abi.encodeWithSelector(IVault.proposeAdapter.selector, newAdapter));
    }
  }

  /**
   * @notice Change adapter of a vault to the previously proposed adapter.
   * @param vaults - addresses of the vaults
   */
  function changeVaultAdapter(address[] memory vaults) external {
    uint8 len = uint8(vaults.length);
    for (uint8 i = 0; i < len; i++) {
      adminProxy.execute(vaults[i], abi.encodeWithSelector(IVault.changeAdapter.selector));
    }
  }

  /**
   * @notice Sets different fees per vault
   * @param vaults - addresses of the vaults to change
   * @param newFees - new fee structures for these vaults
   * @dev Value is in 1e18, e.g. 100% = 1e18 - 1 BPS = 1e12
   * @dev index of _vaults array and _newFees must coincide
   */
  function proposeVaultFees(address[] memory vaults, FeeStructure[] memory newFees) external {
    uint8 len = uint8(vaults.length);
    for (uint8 i = 0; i < len; i++) {
      _verifySubmitter(vaults[i]);
      adminProxy.execute(vaults[i], abi.encodeWithSelector(IVault.proposeFees.selector, abi.encode(newFees[i])));
    }
  }

  /**
   * @notice Change adapter of a vault to the previously proposed adapter.
   * @param vaults - addresses of the vaults
   */
  function changeVaultFees(address[] memory vaults) external {
    uint8 len = uint8(vaults.length);
    for (uint8 i = 0; i < len; i++) {
      adminProxy.execute(vaults[i], abi.encodeWithSelector(IVault.changeFees.selector));
    }
  }

  /**
   * @notice Sets keeperConfig for a vault
   * @param vaults - addresses of the newly deployed vaults
   * @param keeperConfigs - the keeperConfig structs from the VaultParams used in vault deployment
   * @dev index of _vaults array and _keeperConfigs must coincide
   */
  function setVaultKeeperConfig(address[] memory vaults, KeeperConfig[] memory keeperConfigs) external {
    uint8 len = uint8(vaults.length);
    for (uint8 i = 0; i < len; i++) {
      _verifySubmitter(vaults[i]);
      adminProxy.execute(
        vaults[i],
        abi.encodeWithSelector(IVault.setKeeperConfig.selector, abi.encode(keeperConfigs[i]))
      );
    }
  }

  error NotSubmitter(address caller);

  function _verifySubmitter(address vault) internal returns (VaultMetadata memory metadata) {
    metadata = vaultsRegistry.vaults(vault);
    if (msg.sender != metadata.submitter) revert NotSubmitter(msg.sender);
  }

  /*//////////////////////////////////////////////////////////////
                          ENDORSEMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  /**
   * @notice switches whether a vault is endorsed or unendorsed
   * @param targets - addresses of the contracts to change endorsement
   */
  function toggleEndorsement(address[] memory targets) external onlyOwner {
    adminProxy.execute(
      address(endorsementRegistry),
      abi.encodeWithSelector(IEndorsementRegistry.toggleEndorsement.selector, targets)
    );
  }

  /*//////////////////////////////////////////////////////////////
                          STAKING MANAGEMENT LOGIC
    //////////////////////////////////////////////////////////////*/
  error TokenBad(IERC20 token);

  function _verifyToken(address token) internal {
    if (!endorsementRegistry.endorsed(token) || !deploymentController.cloneExists(token))
      revert TokenBad(IERC20(token));
  }

  function addRewardsToken(address[] memory vaults, bytes[] memory rewardsTokenData) public {
    VaultMetadata memory metadata;
    uint8 len = uint8(vaults.length);
    for (uint256 i = 0; i < len; i++) {
      address rewardsToken = abi.decode(rewardsTokenData[i][:20], (address));
      _verifyToken(rewardsToken);
      metadata = _verifySubmitterOrOwner(vaults[i]);
      adminProxy.execute(
        metadata.staking,
        abi.encodeWithSelector(IMultiRewardsStaking.addRewardsToken.selector, rewardsTokenData[i])
      );
    }
  }

  function changeRewardsSpeed(address[] memory vaults, bytes[] memory rewardsTokenData) external {
    VaultMetadata memory metadata;
    uint8 len = uint8(vaults.length);
    for (uint256 i = 0; i < len; i++) {
      metadata = _verifySubmitter(vaults[i]);
      adminProxy.execute(
        metadata.staking,
        abi.encodeWithSelector(IMultiRewardsStaking.changeRewardSpeed.selector, rewardsTokenData[i])
      );
    }
  }

  function fundReward(address[] memory vaults, bytes[] memory rewardsTokenData) external {
    VaultMetadata memory metadata;
    uint8 len = uint8(vaults.length);
    for (uint256 i = 0; i < len; i++) {
      metadata = vaultsRegistry.vaults(vaults[i]);
      (address rewardsToken, uint256 amount) = abi.decode(rewardsTokenData[i], (address, uint256));
      IMultiRewardsStaking(metadata.staking).fundReward(IERC20(rewardsToken), amount);
    }
  }

  /*//////////////////////////////////////////////////////////////
                          ESCROW MANAGEMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  IMultiRewardsEscrow public escrow;

  function setEscrowTokenFee(IERC20[] memory tokens, uint256[] memory fees) external onlyOwner {
    adminProxy.execute(address(escrow), abi.encodeWithSelector(IMultiRewardsEscrow.setFees.selector, tokens, fees));
  }

  function setEscrowKeeperPerc(uint256 keeperPerc) external onlyOwner {
    adminProxy.execute(address(escrow), abi.encodeWithSelector(IMultiRewardsEscrow.setKeeperPerc.selector, keeperPerc));
  }

  /*//////////////////////////////////////////////////////////////
                          FACTORY MANAGEMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  function addTemplateType(bytes32[] memory templateTypes) external onlyOwner {
    address _deploymentController = address(deploymentController);
    uint8 len = uint8(templateTypes.length);
    for (uint256 i = 0; i < len; i++) {
      adminProxy.execute(
        _deploymentController,
        abi.encodeWithSelector(IDeploymentController.addTemplateType.selector, templateTypes[i])
      );
    }
  }

  /*//////////////////////////////////////////////////////////////
                          PAUSING LOGIC
    //////////////////////////////////////////////////////////////*/
  error NotSubmitterNorOwner(address caller);

  function pauseAdapter(address[] calldata vaults) external {
    uint8 len = uint8(vaults.length);
    for (uint256 i = 0; i < len; i++) {
      _verifySubmitterOrOwner(vaults[i]);
      adminProxy.execute(IVault(vaults[i]).adapter(), abi.encodeWithSelector(IPausable.pause.selector));
    }
  }

  function pauseVault(address[] calldata vaults) external {
    uint8 len = uint8(vaults.length);
    for (uint256 i = 0; i < len; i++) {
      _verifySubmitterOrOwner(vaults[i]);
      adminProxy.execute(vaults[i], abi.encodeWithSelector(IPausable.pause.selector));
    }
  }

  function unpauseAdapter(address[] calldata vaults) external {
    uint8 len = uint8(vaults.length);
    for (uint256 i = 0; i < len; i++) {
      _verifySubmitterOrOwner(vaults[i]);
      adminProxy.execute(IVault(vaults[i]).adapter(), abi.encodeWithSelector(IPausable.unpause.selector));
    }
  }

  function unpauseVault(address[] calldata vaults) external {
    uint8 len = uint8(vaults.length);
    for (uint256 i = 0; i < len; i++) {
      _verifySubmitterOrOwner(vaults[i]);
      adminProxy.execute(vaults[i], abi.encodeWithSelector(IPausable.unpause.selector));
    }
  }

  function _verifySubmitterOrOwner(address vault) internal returns (VaultMetadata memory metadata) {
    metadata = vaultsRegistry.vaults(vault);
    if (msg.sender != metadata.submitter || msg.sender != owner) revert NotSubmitterNorOwner(msg.sender);
  }

  /*//////////////////////////////////////////////////////////////
                          OWNERSHIP LOGIC
    //////////////////////////////////////////////////////////////*/

  IAdminProxy public adminProxy;

  /**
   * @notice transfers ownership of VaultRegistry and VaultsV1Factory contracts from controller
   * @dev newOwner address must call acceptOwnership on registry and factory
   */
  function nominateNewAdminProxyOwner(address newOwner) external onlyOwner {
    adminProxy.nominateNewOwner(newOwner);
  }

  /**
   * @notice transfers ownership of VaultRegistry and VaultsV1Factory contracts to controller
   * @dev registry and factory must nominate controller as new owner first
   * acceptance function should be called when deploying controller contract
   */
  function acceptAdminProxyOwnership() external onlyOwner {
    adminProxy.acceptOwnership();
  }

  /*//////////////////////////////////////////////////////////////
                          ADMIN LOGIC
    //////////////////////////////////////////////////////////////*/

  uint256 public managementFee;

  error InvalidManagementFee(uint256 fee);

  event ManagementFeeChanged(uint256 oldFee, uint256 newFee);

  // TODO we would still need to update all adapter retroactively
  function setManagementFee(uint256 newFee) external onlyOwner {
    // Dont take more than 10% managementFee
    if (newFee >= 1e17) revert InvalidManagementFee(newFee);

    emit ManagementFeeChanged(managementFee, newFee);

    managementFee = newFee;
  }

  uint256 public harvestCooldown;

  // TODO we would still need to update all adapter retroactively
  function setHarvestCooldown(uint256 newCooldown) external onlyOwner {
    // Dont take more than 10% managementFee
    if (newCooldown >= 1e17) revert InvalidManagementFee(newCooldown);

    emit ManagementFeeChanged(harvestCooldown, newCooldown);

    harvestCooldown = newCooldown;
  }
}
