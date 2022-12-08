// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import { Owned } from "../utils/Owned.sol";
import { IKeeperIncentiveV2 } from "../interfaces/IKeeperIncentiveV2.sol";
import { KeeperConfig } from "../utils/KeeperIncentivized.sol";
import { IERC20 } from "openzeppelin-contracts/token/ERC20/IERC20.sol";
import { IVault, VaultParams, FeeStructure } from "../interfaces/vault/IVault.sol";
import { IMultiRewardsStaking } from "../interfaces/IMultiRewardsStaking.sol";
import { IMultiRewardsEscrow } from "../interfaces/IMultiRewardsEscrow.sol";
import { IDeploymentController } from "../interfaces/vault/IDeploymentController.sol";
import { Template } from "../interfaces/vault/ITemplateRegistry.sol";
import { IEndorsementRegistry } from "../interfaces/vault/IEndorsementRegistry.sol";
import { IVaultsRegistry, VaultMetadata } from "../interfaces/vault/IVaultsRegistry.sol";
import { IAdminProxy } from "../interfaces/vault/IAdminProxy.sol";
import { IERC4626 } from "../interfaces/vault/IERC4626.sol";
import { IStrategy } from "../interfaces/vault/IStrategy.sol";
import { IAdapter } from "../interfaces/vault/IAdapter.sol";

contract VaultsController is Owned {
  /*//////////////////////////////////////////////////////////////
                               IMMUTABLES
    //////////////////////////////////////////////////////////////*/
  bytes32 public immutable VAULT = "Vault";
  bytes32 public immutable ADAPTER = "Adapter";
  bytes32 public immutable STRATEGY = "Strategy";
  bytes32 public immutable STAKING = "Staking";

  constructor(
    address _owner,
    IAdminProxy _adminProxy,
    IDeploymentController _deploymentController,
    IEndorsementRegistry _endorsementRegistry,
    IVaultsRegistry _vaulsRegistry,
    IKeeperIncentiveV2 _keeperIncentive,
    IMultiRewardsEscrow _escrow
  ) Owned(_owner) {
    adminProxy = _adminProxy;
    deploymentController = _deploymentController;
    endorsementRegistry = _endorsementRegistry;
    vaultsRegistry = _vaulsRegistry;
    keeperIncentive = _keeperIncentive;
    escrow = _escrow;
  }

  /*//////////////////////////////////////////////////////////////
                          DEPLOYMENT LOGIC
    //////////////////////////////////////////////////////////////*/
  error MisConfig();
  error AssetNotEndorsed(IERC20 asset);

  event VaultDeployed(address indexed vault, address indexed staking, address indexed adapter);

  struct DeploymentArgs {
    /// @Notice templateId
    bytes32 Id;
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
    if (vaultData.adapter != address(0)) {
      if (adapterData.Id > 0) revert MisConfig();
      if (!_deploymentController.cloneExists(address(vaultData.adapter))) revert MisConfig();
    }

    if (adapterData.Id.length > 0)
      vaultData.adapter = _deployStrategyAndAdapter(strategyData, adapterData, asset, _deploymentController);

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

    emit VaultDeployed(vault, staking, vaultData.adapter);
  }

  function _deployVault(VaultParams memory vaultData, IDeploymentController deploymentController)
    internal
    returns (address vault)
  {
    vaultData.owner = address(adminProxy);
    vaultData.keeperIncentive = keeperIncentive;

    vault = deploymentController.deploy(
      VAULT,
      "V1",
      abi.encodePacked(
        bytes4(
          keccak256(
            "initialize(address,address,(uint256,uint256,uint256,uint256),address,address,(uint256,uint256,uint256),address)"
          )
        ),
        vaultData
      )
    );
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
    address strategy;
    bytes[8] memory requiredSigs;
    if (strategyData.id.length > 0) {
      strategy = deploymentController.deploy(STRATEGY, strategyData.id, "");
      Template memory strategyTemplate = deploymentController.getTemplate(STRATEGY, strategyData.id);
      requiredSigs = strategyTemplate.requiredSigs;
    }

    bytes memory adapterBaseData = abi.encode(
      asset,
      address(adminProxy),
      IStrategy(strategy),
      requiredSigs,
      strategyData.data,
      harvestCooldown
    );

    adapter = deploymentController.deploy(
      ADAPTER,
      adapterData.Id,
      abi.encodePacked(bytes4(keccak256("initialize(bytes,bytes)")), bytes.concat(adapterBaseData, adapterData.data))
    );

    IAdapter(adapter).setManagementFee(managementFee);
  }

  function deployStaking(IERC20 asset) public onlyOwner returns (address) {
    if (!endorsementRegistry.endorsed(address(asset))) revert AssetNotEndorsed(asset);
    return _deployStaking(asset, deploymentController);
  }

  function _deployStaking(IERC20 asset, IDeploymentController deploymentController) internal returns (address staking) {
    staking = deploymentController.deploy(
      STAKING,
      "MultiRewardsStaking",
      abi.encodePacked(bytes4(keccak256("initialize(address,address,address)")), asset, escrow, adminProxy)
    );
  }

  /**
   * @notice sets keeperConfig and creates incentive for new vault deployment
   * @dev avoids stack too deep in deployVaultFromFactory
   */
  function _handleKeeperSetup(
    address _vault,
    KeeperConfig memory _keeperConfig,
    bytes memory addKeeperData
  ) internal {
    (bool _keeperEnabled, bool _keeperOpenToEveryone, uint256 _keeperCooldown) = abi.decode(
      addKeeperData,
      (bool, bool, uint256)
    );
    IVault(_vault).setKeeperConfig(_keeperConfig);
    keeperIncentive.createIncentive(
      _vault,
      _keeperConfig.keeperPayout,
      _keeperEnabled,
      _keeperOpenToEveryone,
      _vault,
      _keeperCooldown,
      0
    );
  }

  function _registerVault(
    address vault,
    address staking,
    VaultMetadata memory metadata
  ) internal {
    metadata.vaultAddress = vault;
    metadata.staking = staking;
    metadata.submitter = msg.sender;

    vaultsRegistry.registerVault(metadata);
  }

  /*//////////////////////////////////////////////////////////////
                          VAULT MANAGEMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  /**
   * @notice Propose a new Strategy.
   * @param vaults - addresses of the vaults
   * @param newAdapter - new strategies to be proposed for the vault
   * @dev index of _vaults array and _newStrategies array must coincide
   */
  function proposeNewVaultAdapter(address[] memory vaults, IERC4626[] memory newAdapter) external {
    IDeploymentController _deploymentController = deploymentController;
    uint8 len = vaults.length;
    for (uint8 i = 0; i < len; i++) {
      _verifySubmitter(vaults[i]);
      _deploymentController.cloneExists(address(newAdapter[i]));
      IVault(vaults[i]).proposeNewStrategy(newAdapter[i]);
    }
  }

  /**
   * @notice Change adapter of a vault to the previously proposed adapter.
   * @param vaults - addresses of the vaults
   */
  function changeVaultStrategy(address[] memory vaults) external {
    uint8 len = vaults.length;
    for (uint8 i = 0; i < len; i++) {
      IVault(vaults[i]).changeStrategy();
    }
  }

  /**
   * @notice Sets different fees per vault
   * @param vaults - addresses of the vaults to change
   * @param newFees - new fee structures for these vaults
   * @dev Value is in 1e18, e.g. 100% = 1e18 - 1 BPS = 1e12
   * @dev index of _vaults array and _newFees must coincide
   */
  function setVaultFees(address[] memory vaults, FeeStructure[] memory newFees) external {
    uint8 len = vaults.length;
    for (uint8 i = 0; i < len; i++) {
      _verifySubmitter(vaults[i]);
      IVault(vaults[i]).setFees(newFees[i]);
    }
  }

  /**
   * @notice Sets keeperConfig for a vault
   * @param vaults - addresses of the newly deployed vaults
   * @param keeperConfigs - the keeperConfig structs from the VaultParams used in vault deployment
   * @dev index of _vaults array and _keeperConfigs must coincide
   */
  function setVaultKeeperConfig(address[] memory vaults, KeeperConfig[] memory keeperConfigs) external {
    uint8 len = vaults.length;
    for (uint8 i = 0; i < len; i++) {
      _verifySubmitter(vaults[i]);
      IVault(vaults[i]).setKeeperConfig(keeperConfigs[i]);
    }
  }

  error NotSubmitter(address caller);

  function _verifySubmitter(address vault) internal returns (VaultMetadata memory metadata) {
    metadata = vaultsRegistry.getVault(vault);
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
    endorsementRegistry.toggleEndorsement(targets);
  }

  /*//////////////////////////////////////////////////////////////
                          STAKING MANAGEMENT LOGIC
    //////////////////////////////////////////////////////////////*/
  error TokenBad(IERC20 token);

  function _verifyToken(address token) internal {
    if (!endorsementRegistry.endorsed(token) || !deploymentController.cloneExists(token)) revert TokenBad(token);
  }

  function addRewardsToken(address[] memory vaults, bytes[] memory rewardsTokenData) public {
    VaultMetadata memory metadata;
    uint8 len = vaults.length;
    for (uint256 i = 0; i < len; i++) {
      (
        address rewardsToken,
        uint160 rewardsPerSecond,
        uint256 amount,
        bool useEscrow,
        uint224 escrowDuration,
        uint24 escrowPercentage,
        uint256 offset
      ) = abi.decode(rewardsTokenData, (address, uint160, uint256, bool, uint224, uint24, uint256));
      _verifyToken(rewardsToken);
      metadata = _verifySubmitterOrOwner(vaults[i]);
      IMultiRewardsStaking(metadata.staking).addRewardsToken(
        IERC20(rewardsToken),
        rewardsPerSecond,
        amount,
        useEscrow,
        escrowDuration,
        escrowPercentage,
        offset
      );
    }
  }

  function changeRewardsSpeed(address[] memory vaults, bytes[] memory rewardsTokenData) external {
    VaultMetadata memory metadata;
    uint8 len = vaults.length;
    for (uint256 i = 0; i < len; i++) {
      metadata = _verifySubmitter(vaults[i]);
      (address rewardsToken, uint160 rewardsPerSecond) = abi.decode(rewardsTokenData, (address, uint160));
      IMultiRewardsStaking(metadata.staking).changeRewardSpeed(IERC20(rewardsToken), rewardsPerSecond);
    }
  }

  function fundReward(address[] memory vaults, bytes[] memory rewardsTokenData) external {
    VaultMetadata memory metadata;
    uint8 len = vaults.length;
    for (uint256 i = 0; i < len; i++) {
      metadata = vaultsRegistry.getVault(vaults[i]);
      (address rewardsToken, uint256 amount) = abi.decode(rewardsTokenData, (address, uint256));
      IMultiRewardsStaking(metadata.staking).fundReward(IERC20(rewardsToken), amount);
    }
  }

  /*//////////////////////////////////////////////////////////////
                          ESCROW MANAGEMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  IMultiRewardsEscrow public escrow;

  function setEscrowTokenFee(IERC20[] memory tokens, uint256[] memory fees) external onlyOwner {
    escrow.setFees(tokens, fees);
  }

  function setEscrowKeeperPerc(uint256 keeperPerc) external onlyOwner {
    escrow.setKeeperPerc(keeperPerc);
  }

  // TODO do we need to change escrow?

  /*//////////////////////////////////////////////////////////////
                          FACTORY MANAGEMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  function addTemplateType(bytes32[] memory templateTypes) external onlyOwner {
    IDeploymentController _deploymentController = deploymentController;
    uint8 len = templateTypes.length;
    for (uint256 i = 0; i < len; i++) {
      _deploymentController.addTemplateType(templateTypes[i]);
    }
  }

  /*//////////////////////////////////////////////////////////////
                          PAUSING LOGIC
    //////////////////////////////////////////////////////////////*/
  error NotSubmitterNorOwner(address caller);

  function pauseAdapter(address[] calldata vaults) external {
    uint8 len = vaults.length;
    for (uint256 i = 0; i < len; i++) {
      _verifySubmitterOrOwner(vaults[i]);
      address adapter = IVault(vaults[i]).adapter();
      IVault(adapter).pause();
    }
  }

  function pauseVault(address[] calldata vaults) external {
    uint8 len = vaults.length;
    for (uint256 i = 0; i < len; i++) {
      _verifySubmitterOrOwner(vaults[i]);
      IVault(vaults[i]).pause();
    }
  }

  function unpauseAdapter(address[] calldata vaults) external {
    uint8 len = vaults.length;
    for (uint256 i = 0; i < len; i++) {
      _verifySubmitterOrOwner(vaults[i]);
      address adapter = IVault(vaults[i]).adapter();
      IVault(adapter).unpause();
    }
  }

  function unpauseVault(address[] calldata vaults) external {
    uint8 len = vaults.length;
    for (uint256 i = 0; i < len; i++) {
      _verifySubmitterOrOwner(vaults[i]);
      IVault(vaults[i]).unpause();
    }
  }

  function _verifySubmitterOrOwner(address vault) internal returns (VaultMetadata memory metadata) {
    metadata = vaultsRegistry.getVault(vault);
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

  IDeploymentController public deploymentController;
  IEndorsementRegistry public endorsementRegistry;
  IVaultsRegistry public vaultsRegistry;
  IKeeperIncentiveV2 public keeperIncentive;

  //TODO which of these might we want to update?

  uint256 public managementFee;

  // TODO we would still need to update all adapter retroactively
  function setManagementFee(uint256 newFee) external onlyOwner {}

  uint256 public harvestCooldown;

  // TODO we would still need to update all adapter retroactively
  function setHarvestCooldown(uint256 newCooldown) external onlyOwner {}
}
