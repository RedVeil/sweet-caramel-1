// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "./VaultsV1Registry.sol";
import "./VaultsV1Factory.sol";
import "./VaultStakingFactory.sol";
import "../utils/Owned.sol";
import "../utils/ContractRegistryAccess.sol";
import "../interfaces/IKeeperIncentiveV2.sol";
import "../interfaces/IContractRegistry.sol";
import "../interfaces/IVaultsV1.sol";
import "../interfaces/IVaultsV1Zapper.sol";
import "../interfaces/IStaking.sol";
import "../interfaces/IRewardsEscrow.sol";
import "../interfaces/IERC4626.sol";
import { KeeperConfig } from "../utils/KeeperIncentivized.sol";
import { IContractFactory } from "../interfaces/IContractFactory.sol";

/**
 * @notice controls deploying, registering vaults, adding vault types, updating registry vaults, endorsing and enabling registry vaults, and pausing/unpausing vaults
 * @dev all functions can only be called by owner
 */

contract VaultsV1Controller is Owned, ContractRegistryAccess {
  /* ========== CUSTOM ERRORS ========== */

  error SetZaps();
  error ConflictingInterest();

  /* ========== STATE VARIABLES ========== */

  bytes32 public constant contractName = keccak256("VaultsV1Controller");
  bytes32 internal constant VAULT_REWARDS_ESCROW = keccak256("VaultRewardsEscrow"); // TODO search for other contract names and define them in state not on call

  /* ========== EVENTS ========== */

  event VaultV1Deployed(address vaultAddress, bool endorsed);

  /* ========== CONSTRUCTOR ========== */

  constructor(address _owner, IContractRegistry _contractRegistry)
    Owned(_owner)
    ContractRegistryAccess(_contractRegistry)
  {}

  /* ========== VAULT DEPLOYMENT ========== */

  // TODO remove V1 from all contracts? (purely naming)
  // TODO get rid of zapper, zapIn, zapOut
  // TODO make fee recipient a param so partners can set their own recipient
  /**
   * @notice deploys and registers V1 Vault from VaultsV1Factory
   * @param _vaultParams - struct containing Vault constructor params (address token_, address yearnRegistry_,
    IContractRegistry contractRegistry_, address staking_, FeeStructure feeStructure_)
   * @param _staking - Adds a staking contract to the registry for this particular vault. (If address(0) it will deploy a new VaultStaking contract)
   * @param _endorse - bool if vault is to be endorsed after registration
   * @param _metadataCID - ipfs CID of vault metadata
   * @param _swapTokenAddresses - underlying assets to deposit and recieve LP token
   * @param _swapAddress - ex: stableSwapAddress for Curve
   * @param _exchange - number specifying exchange (1 = curve)
   * @param _zapper - Zapper address
   * @param _zapIn - address of inbound zap contract
   * @param _zapOut - address of outbound zap contract
   * @dev the submitter in the VaultMetadata from the factory will be function caller
   * @dev !Important If _vaultParams.zapper is defined we need to parse in _zapIn and _zapOut since the zapper doesnt work otherwise
   */
  function deployVaultFromV1Factory(
    VaultParams memory _vaultParams,
    address _staking,
    bool _endorse, // TODO remove endorse,
    bytes32 _factoryName,
    bytes memory _deploymentParams,
    string memory _metadataCID,
    address[8] memory _swapTokenAddresses,
    address _swapAddress,
    uint256 _exchange,
    address _zapper,
    address _zapIn,
    address _zapOut
  ) external onlyOwner returns (address vault) {
    // TODO makes this permissionless
    VaultsV1Registry vaultsV1Registry = _vaultsV1Registry();

    // TODO add dynamic strategy deployment
    /*  if (_factoryName != "") {
      if (_vaultParams.strategy != address(0)) revert ConflictingInterest();
      // _vaultParams.strategy = _strategyFactory().deploy(_vaultParams); TODO fix me
    } */

    vault = _vaultsV1Factory().deploy(_vaultParams);

    if (_staking == address(0)) {
      _staking = _vaultStakingFactory().deploy(vault);
    }
    _handleKeeperSetup(vault, _vaultParams.keeperConfig, address(_vaultParams.asset));

    // TODO make RewardsEscrow permissionless and token agnostic
    IRewardsEscrow(_getContract(VAULT_REWARDS_ESCROW)).addAuthorizedContract(_staking);

    // TODO get rid of zapper since we would move it into multicall
    if (_zapper != address(0)) {
      if (_zapIn == address(0) || _zapOut == address(0)) revert SetZaps();

      IVaultsV1Zapper(_zapper).updateVault(address(_vaultParams.asset), vault);
      IVaultsV1Zapper(_zapper).updateZaps(address(_vaultParams.asset), _zapIn, _zapOut);
    }

    VaultMetadata memory metadata = VaultMetadata({
      vaultAddress: vault,
      vaultType: 1, //TODO get rid of vaultType
      enabled: true,
      staking: _staking,
      vaultZapper: _zapper, //TODO get rid of zapper
      submitter: msg.sender,
      metadataCID: _metadataCID,
      swapTokenAddresses: _swapTokenAddresses,
      swapAddress: _swapAddress,
      exchange: _exchange,
      zapIn: _zapIn, //TODO get rid of zapIn
      zapOut: _zapOut //TODO get rid of zapOut
    });

    vaultsV1Registry.registerVault(metadata);

    if (_endorse) vaultsV1Registry.toggleEndorseVault(vault); // TODO remove

    emit VaultV1Deployed(vault, _endorse); // adjust event to not include endorse
  }

  /**
   * @notice sets keeperConfig and creates incentive for new vault deployment
   * @param _vault - address of the newly deployed vault
   * @param _keeperConfig - the keeperConfig struct from the VaultParams used in vault deployment
   * @dev avoids stack too deep in deployVaultFromV1Factory
   */
  function _handleKeeperSetup(
    address _vault,
    KeeperConfig memory _keeperConfig,
    address _asset
  ) internal {
    IVaultsV1(_vault).setKeeperConfig(_keeperConfig);
    IKeeperIncentiveV2(_getContract(keccak256("KeeperIncentive"))).createIncentive(
      _vault,
      _keeperConfig.keeperPayout,
      true, // TODO make this a param
      false, // TODO make this a param
      _vault,
      1 days, // TODO make this a param
      0
    );
  }

  /* ========== VAULT MANAGEMENT FUNCTIONS ========== */

  // TODO use array params in all management functions
  /**
   * @notice updates the VaultMetadata in registry
   * @param _vaultMetadata - struct with updated values
   * @dev vaultAddress, vaultType, and submitter are immutable
   */
  function updateRegistryVault(VaultMetadata memory _vaultMetadata) external onlyOwner {
    _vaultsV1Registry().updateVault(_vaultMetadata);
  }

  //TODO get rid of vaultType
  /**
   * @notice increase the types of vaults that can be registered
   * @param _type - the next vault type to be registered
   * @dev _type must be exactly 1 more than current vaultTypes
   */
  function addVaultTypeToRegistry(uint256 _type) external onlyOwner {
    _vaultsV1Registry().addVaultType(_type);
  }

  /**
   * @notice switches whether a vault is endorsed or unendorsed
   * @param _vaultAddresses - addresses of the vaults to change endorsement
   */
  function toggleEndorseRegistryVault(address[] memory _vaultAddresses) external onlyOwner {
    VaultsV1Registry vaultsV1Registry = _vaultsV1Registry();
    for (uint256 i = 0; i < _vaultAddresses.length; i++) {
      vaultsV1Registry.toggleEndorseVault(_vaultAddresses[i]);
    }
  }

  /**
   * @notice switches whether a vault is enabled or disabled
   * @param _vaultAddresses - addresses of the vaults to enable or disable
   */
  function toggleEnableRegistryVault(address[] memory _vaultAddresses) external onlyOwner {
    VaultsV1Registry vaultsV1Registry = _vaultsV1Registry();
    for (uint256 i = 0; i < _vaultAddresses.length; i++) {
      vaultsV1Registry.toggleEnableVault(_vaultAddresses[i]);
    }
  }

  /**
   * @notice Propose a new Strategy.
   * @param _vault - address of the vault
   * @param _newStrategy - new strategy to be proposed for the vault
   */
  function proposeNewVaultStrategy(address _vault, IERC4626 _newStrategy) external onlyOwner {
    IVaultsV1(_vault).proposeNewStrategy(_newStrategy);
  }

  /**
   * @notice Change strategy of a vault to the previously proposed strategy.
   * @param _vault - address of the vault
   */
  function changeVaultStrategy(address _vault) external onlyOwner {
    IVaultsV1(_vault).changeStrategy();
  }

  /**
   * @notice Sets different fees per vault
   * @param _vaults - addresses of the vaults to change
   * @param _newFees - new fee structures for these vaults
   * @dev Value is in 1e18, e.g. 100% = 1e18 - 1 BPS = 1e12
   */
  function setVaultFees(address[] memory _vaults, IVaultsV1.FeeStructure[] memory _newFees) external onlyOwner {
    for (uint8 i; i < _vaults.length; i++) {
      IVaultsV1(_vaults[i]).setFees(_newFees[i]);
    }
  }

  /**
   * @notice Set staking contract for a vault.
   * @param _vault - address of the vault
   * @param _staking Address of the staking contract.
   */
  function setVaultStaking(address _vault, address _staking) external onlyOwner {
    VaultsV1Registry vaultsV1Registry = _vaultsV1Registry();

    VaultMetadata memory vaultMetadata = vaultsV1Registry.getVault(_vault);

    // TODO delete this since having more authorized contracts doesnt do any harm but a user could potentially loose rewards if they cant create an escrow
    if (vaultMetadata.staking != address(0)) {
      IRewardsEscrow(_getContract(VAULT_REWARDS_ESCROW)).removeAuthorizedContract(vaultMetadata.staking);
    }

    if (_staking != address(0)) {
      IRewardsEscrow(_getContract(VAULT_REWARDS_ESCROW)).addAuthorizedContract(_staking);
    }

    vaultMetadata.staking = _staking;

    vaultsV1Registry.updateVault(vaultMetadata);
  }

  // TODO delete this as it will be handled by multicall
  /**
   * @notice Set VaultsZapper contract for a vault.
   * @param _vault - address of the vault
   * @param _zapper Address of the VaultZapper contract.
   * @dev This function will update the oldZapper contract used by a Vault and remove the asset->vault relationship
   * @dev This function will update the new zapper contract used and either remove or update the asset->vault relationship if `_zapper`==`address(0)`
   */
  function setVaultZapper(address _vault, address _zapper) external onlyOwner {
    address asset = IVaultsV1(_vault).asset();

    VaultsV1Registry vaultsV1Registry = _vaultsV1Registry();

    VaultMetadata memory vaultMetadata = vaultsV1Registry.getVault(_vault);

    if (vaultMetadata.vaultZapper != address(0)) IVaultsV1Zapper(vaultMetadata.vaultZapper).removeVault(asset);

    if (_zapper == address(0)) {
      IVaultsV1Zapper(_zapper).removeVault(asset);
    } else {
      IVaultsV1Zapper(_zapper).updateVault(asset, _vault);
    }

    vaultMetadata.vaultZapper = _zapper;

    vaultsV1Registry.updateVault(vaultMetadata);
  }

  /**
   * @notice Sets keeperConfig for a vault
   * @param _vault - address of the newly deployed vault
   * @param _keeperConfig - the keeperConfig struct from the VaultParams used in vault deployment
   */
  function setVaultKeeperConfig(address _vault, KeeperConfig memory _keeperConfig) external onlyOwner {
    IVaultsV1(_vault).setKeeperConfig(_keeperConfig);
  }

  /**
   * @notice Pause deposits
   * @param _vaultAddresses - addresses of the vaults to pause
   * @dev caller on vault contract must have DAO_ROLE or VAULTS_V1_CONTROLLER from ACLRegistry
   */
  function pauseVaults(address[] memory _vaultAddresses) public onlyOwner {
    for (uint256 i = 0; i < _vaultAddresses.length; i++) {
      IVaultsV1(_vaultAddresses[i]).pauseContract();
    }
  }

  /**
   * @notice Unpause deposits
   * @param _vaultAddresses - addresses of the vaults to unpause
   * @dev caller on vault contract must have DAO_ROLE or VAULTS_V1_CONTROLLER from ACLRegistry
   */
  function unpauseVaults(address[] memory _vaultAddresses) public onlyOwner {
    for (uint256 i = 0; i < _vaultAddresses.length; i++) {
      IVaultsV1(_vaultAddresses[i]).unpauseContract();
    }
  }

  // Todo delete since vaultType doesnt exist anymore
  /**
   * @notice Pause deposits on all vaults in registry
   */
  function pauseAllVaultsByType(uint256 _type) external onlyOwner {
    if (_type > _vaultsV1Registry().vaultTypes() || _type <= 0) revert VaultsV1Registry.InvalidVaultType();

    try _vaultsV1Registry().getVaultsByType(_type) returns (address[] memory registeredTypeVaults) {
      pauseVaults(registeredTypeVaults);
    } catch {
      return;
    }
  }

  // Todo delete since vaultType doesnt exist anymore
  /**
   * @notice Unpause deposits on all vaults in registry
   */
  function unpauseAllVaultsByType(uint256 _type) external onlyOwner {
    if (_type > _vaultsV1Registry().vaultTypes() || _type <= 0) revert VaultsV1Registry.InvalidVaultType();

    try _vaultsV1Registry().getVaultsByType(_type) returns (address[] memory registeredTypeVaults) {
      unpauseVaults(registeredTypeVaults);
    } catch {
      return;
    }
  }

  /* ========== VAULTSTAKING MANAGEMENT FUNCTIONS ========== */
  
  function setStakingEscrowDurations(address[] calldata _stakingContracts, uint256[] calldata _escrowDurations)
    external
    onlyOwner
  {
    for (uint256 i = 0; i < _stakingContracts.length; i++) {
      IStaking(_stakingContracts[i]).setEscrowDuration(_escrowDurations[i]);
    }
  }

  function setStakingRewardsDurations(address[] calldata _stakingContracts, uint256[] calldata _rewardsDurations)
    external
    onlyOwner
  {
    for (uint256 i = 0; i < _stakingContracts.length; i++) {
      IStaking(_stakingContracts[i]).setRewardsDuration(_rewardsDurations[i]);
    }
  }

  function pauseStakingContracts(address[] calldata _stakingContracts) external onlyOwner {
    for (uint256 i = 0; i < _stakingContracts.length; i++) {
      IStaking(_stakingContracts[i]).pauseContract();
    }
  }

  function unpauseStakingContracts(address[] calldata _stakingContracts) external onlyOwner {
    for (uint256 i = 0; i < _stakingContracts.length; i++) {
      IStaking(_stakingContracts[i]).unpauseContract();
    }
  }

  // TODO delete since zapper is no longer in use
  /* ========== VAULTZAPPER MANAGEMENT FUNCTIONS ========== */
  /**
   * @notice Set zapIn and zapOut contracts on the VaultsV1Zapper for a certain asset
   * @param _vault - address of the vault
   * @param _zapper - address of the vaultsZapper contract.
   * @param _zapIn - address of the zapIn contract used by VaultsV1Zapper (Should be ZeroXCurveZapper or SwapZapper)
   * @param _zapOut - address of the zapOut contract used by VaultsV1Zapper (Should be ZeroXCurveZapper or SwapZapper)
   */
  function setZapperZaps(
    address _vault,
    address _zapper,
    address _zapIn,
    address _zapOut
  ) external onlyOwner {
    address asset = IVaultsV1(_vault).asset();

    IVaultsV1Zapper(_zapper).updateZaps(asset, _zapIn, _zapOut);

    VaultsV1Registry vaultsV1Registry = _vaultsV1Registry();

    VaultMetadata memory vaultMetadata = vaultsV1Registry.getVault(_vault);

    vaultMetadata.zapIn = _zapIn;
    vaultMetadata.zapOut = _zapOut;

    vaultsV1Registry.updateVault(vaultMetadata);
  }

  /**
   * @notice Changes the fee for a certain vault asset on the VaultsZapper
   * @param _zapper Address of the VaultZapper
   * @param _inBps DepositFee in BPS
   * @param _outBps WithdrawlFee in BPS
   * @dev Per default both of these values are not set. Therefore a fee has to be explicitly be set with this function
   */
  function setZapperGlobalFee(
    address _zapper,
    uint256 _inBps,
    uint256 _outBps
  ) external onlyOwner {
    IVaultsV1Zapper(_zapper).setGlobalFee(_inBps, _outBps);
  }

  /**
   * @notice Changes the fee for a certain vault asset on the VaultsZapper
   * @param _zapper Address of the VaultZapper
   * @param _asset Address of the underlying asset of a vault
   * @param _useAssetFee Switch to toggle an asset specific fee on or off
   * @param _inBps DepositFee in BPS
   * @param _outBps WithdrawlFee in BPS
   * @dev Per default both of these values are not set. Therefore a fee has to be explicitly be set with this function
   */
  function setZapperAssetFee(
    address _zapper,
    address _asset,
    bool _useAssetFee,
    uint256 _inBps,
    uint256 _outBps
  ) external onlyOwner {
    IVaultsV1Zapper(_zapper).setFee(_asset, _useAssetFee, _inBps, _outBps);
  }

  /**
   * @notice Sets keeperConfig for a VaultsZapper
   * @param _zapper Address of the VaultZapper
   * @param _asset Address of the underlying asset of a vault
   * @param _keeperConfig - the keeperConfig struct from the VaultParams used in vault deployment
   */
  function setZapperKeeperConfig(
    address _zapper,
    address _asset,
    KeeperConfig memory _keeperConfig
  ) external onlyOwner {
    IVaultsV1Zapper(_zapper).setKeeperConfig(_asset, _keeperConfig);
  }

  /* ========== FACTORY MANAGEMENT FUNCTIONS ========== */

  // TODO remove since implementation will be passed directly
  function setFactoryImplementation(bytes32 _factoryName, address _implementation) external onlyOwner {
    IContractFactory(_getContract(_factoryName)).setImplementation(_implementation);
  }

  /* ========== STRATEGY/WRAPPER DEPLOYMENT FUNCTIONS ========== */

  // TODO add implementation address
  // TODO make also permissionless so long as the factory is permissioned
  function deployStrategy(bytes32 _factoryName, bytes memory _deploymentParams)
    external
    onlyOwner
    returns (address strategy)
  {
    (, bytes memory result) = _getContract(_factoryName).call(_deploymentParams);
    strategy = abi.decode(result, (address));
  }

  /* ========== OWNERSHIP FUNCTIONS ========== */

  /**
   * @notice transfers ownership of VaultRegistry and VaultsV1Factory contracts from controller
   * @dev newOwner address must call acceptOwnership on registry and factory
   */
  function transferFactoryAndRegistryOwnership(bytes32[] memory _factoryNames, address _newOwner) external onlyOwner {
    for (uint8 i; i < _factoryNames.length; i++) {
      IContractFactory(_getContract(_factoryNames[i])).nominateNewOwner(_newOwner);
    }
  }

  /**
   * @notice transfers ownership of VaultRegistry and VaultsV1Factory contracts to controller
   * @dev registry and factory must nominate controller as new owner first
   * acceptance function should be called when deploying controller contract
   */
  function acceptFactoryAndRegistryOwnership(bytes32[] memory _factoryNames) external onlyOwner {
    for (uint8 i; i < _factoryNames.length; i++) {
      IContractFactory(_getContract(_factoryNames[i])).acceptOwnership();
    }
  }

  /* ========== INTERNAL FUNCTIONS ========== */

  /**
   * @notice helper function to get VaultsV1Registry contract
   */
  function _vaultsV1Registry() private view returns (VaultsV1Registry) {
    return VaultsV1Registry(_getContract(keccak256("VaultsV1Registry")));
  }

  /**
   * @notice helper function to get VaultsV1Factory contract
   */
  function _vaultsV1Factory() private view returns (VaultsV1Factory) {
    return VaultsV1Factory(_getContract(keccak256("VaultsV1Factory")));
  }

  /**
   * @notice helper function to get VaultStakingFactory contract
   */
  function _vaultStakingFactory() private view returns (VaultStakingFactory) {
    return VaultStakingFactory(_getContract(keccak256("VaultStakingFactory")));
  }

  /**
   * @notice Override for ContractRegistryAccess.
   */
  function _getContract(bytes32 _name) internal view override(ContractRegistryAccess) returns (address) {
    return super._getContract(_name);
  }
}
