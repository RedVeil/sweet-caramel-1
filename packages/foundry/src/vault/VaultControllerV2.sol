// SPDX-License-Identifier: GPL-3.0
// Docgen-SOLC: 0.8.0
pragma solidity ^0.8.0;

import "./VaultsRegistry.sol";
import "./VaultsFactory.sol";
import "../utils/Owned.sol";
import "../utils/ContractRegistryAccess.sol";
import "../interfaces/IKeeperIncentiveV2.sol";
import "../interfaces/IContractRegistry.sol";
import { IERC20 } from "openzeppelin-contracts/token/ERC20/IERC20.sol";
import { IVault } from "../interfaces/vault/IVault.sol";
import { IMultiRewardsStaking } from "../interfaces/IMultiRewardsStaking.sol";
import { IMultiRewardsEscrow } from "../interfaces/IMultiRewardsEscrow.sol";
import { IVaultsFactory } from "../interfaces/vault/IVaultsFactory.sol";
import "../interfaces/IRewardsEscrow.sol";
import "../interfaces/vault/IERC4626.sol";
import { KeeperConfig } from "../utils/KeeperIncentivized.sol";
import { IContractFactory } from "../interfaces/IContractFactory.sol";

/**
 * @notice controls deploying, registering vaults, adding vault types, updating registry vaults, endorsing and enabling registry vaults, and pausing/unpausing vaults
 * @dev all functions can only be called by owner
 */

struct VaultParams {
  ERC20 asset;
  IERC4626 strategy;
  IContractRegistry contractRegistry;
  IVault.FeeStructure feeStructure;
  address feeRecipient;
  KeeperConfig keeperConfig;
}

contract VaultsController is Owned, ContractRegistryAccess {
  /*//////////////////////////////////////////////////////////////
                               IMMUTABLES
    //////////////////////////////////////////////////////////////*/
  bytes32 public constant contractName = keccak256("VaultsController");

  constructor(address _owner, IContractRegistry _contractRegistry)
    Owned(_owner)
    ContractRegistryAccess(_contractRegistry)
  {}

  /*//////////////////////////////////////////////////////////////
                          DEPLOYMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  event VaultDeployed(address indexed vault, address indexed staking, address indexed strategy);

  /**
   * @notice deploys and registers Vault from VaultsFactory
   * @param _cloneAddresses - encoded implementation contract addresses for deploying clones of Vault, VaultStaking, and Strategy contracts
   * @param _vaultParams - struct containing Vault init params (ERC20 asset_, IERC4626 strategy_ IContractRegistry contractRegistry_, FeeStructure memory feeStructure_, address feeRecipient_, KeeperConfig, memory keeperConfig_)
   * @param _staking - Adds a staking contract to the registry for this particular vault. (If address(0) it will deploy a new VaultStaking contract)
   * @param _strategyParams - encoded params of initialize function for strategy contract
   * @param _metadataCID - ipfs CID of vault metadata
   * @param _swapTokenAddresses - underlying assets to deposit and recieve LP token
   * @param _swapAddress - ex: stableSwapAddress for Curve
   * @param _exchange - number specifying exchange (1 = curve)
   * @param _keeperEnabled - bool if the incentive is enabled
   * @param _keeperOpenToEveryone - bool if the incentive is open to all
   * @param _keeperCooldown - time period that must pass before calling keeper enabled functions
   * @dev the submitter in the VaultMetadata from the factory will be function caller
   */
  // TODO add deployment purely for strategy, adapter, staking
  // 1. Adapter
  // 2. OPTIONAL - Strategy
  // 3. Vault
  // 4. OPTIONAL - Staking
  // 5. Handle Keeper Setup
  // 6. Safe in Registry
  function deployVaultFromFactory(
    bytes memory _cloneAddresses,
    VaultParams memory _vaultParams,
    address _staking,
    bytes memory _strategyParams,
    string memory _metadataCID,
    address[8] memory _swapTokenAddresses,
    address _swapAddress,
    uint256 _exchange,
    bool _keeperEnabled,
    bool _keeperOpenToEveryone,
    uint256 _keeperCooldown
  ) external returns (address vault) {
    VaultsRegistry vaultsRegistry = _vaultsRegistry();

    (address vaultImplementation, address stakingImplementation, address strategyImplementation) = abi.decode(
      _cloneAddresses,
      (address, address, address)
    );

    vault = _vaultsFactory().deploy(vaultImplementation, abi.encode(_vaultParams));

    if (_staking == address(0)) {
      address stakingToken = IVault(vault).asset();

      _staking = _vaultsFactory().deploy(
        stakingImplementation,
        abi.encode(IERC20(stakingToken), _vaultParams.contractRegistry)
      );
    }

    address strategy = _deployStrategy(strategyImplementation, _strategyParams);

    _handleKeeperSetup(vault, _vaultParams.keeperConfig, _keeperEnabled, _keeperOpenToEveryone, _keeperCooldown);

    IRewardsEscrow(_getContract(VAULT_REWARDS_ESCROW)).addAuthorizedContract(_staking);

    VaultMetadata memory metadata = VaultMetadata({
      vaultAddress: vault,
      staking: _staking,
      submitter: msg.sender,
      metadataCID: _metadataCID,
      swapTokenAddresses: _swapTokenAddresses,
      swapAddress: _swapAddress,
      exchange: _exchange
    });

    vaultsRegistry.registerVault(metadata);

    emit VaultDeployed(vault, _staking, strategy);
  }

  /**
   * @notice sets keeperConfig and creates incentive for new vault deployment
   * @param _vault - address of the newly deployed vault
   * @param _keeperConfig - the keeperConfig struct from the VaultParams used in vault deployment
   * @param _keeperEnabled - bool if the incentive is enabled
   * @param _keeperOpenToEveryone - bool if the incentive is open to all
   * @param _keeperCooldown - time period that must pass before calling keeper enabled functions
   * @dev avoids stack too deep in deployVaultFromFactory
   */
  function _handleKeeperSetup(
    address _vault,
    KeeperConfig memory _keeperConfig,
    bool _keeperEnabled,
    bool _keeperOpenToEveryone,
    uint256 _keeperCooldown
  ) internal {
    IVault(_vault).setKeeperConfig(_keeperConfig);
    IKeeperIncentiveV2(_getContract(keccak256("KeeperIncentive"))).createIncentive(
      _vault,
      _keeperConfig.keeperPayout,
      _keeperEnabled,
      _keeperOpenToEveryone,
      _vault,
      _keeperCooldown,
      0
    );
  }

  /*//////////////////////////////////////////////////////////////
                          VAULT MANAGEMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  /**
   * @notice Propose a new Strategy.
   * @param _vaults - addresses of the vaults
   * @param _newStrategies - new strategies to be proposed for the vault
   * @dev index of _vaults array and _newStrategies array must coincide
   */
  function proposeNewVaultStrategy(address[] memory _vaults, IERC4626[] memory _newStrategies) external {
    for (uint256 i = 0; i < _vaults.length; i++) {
      _verifySubmitter(_vaults[i]);
      IVault(_vaults[i]).proposeNewStrategy(_newStrategies[i]);
    }
  }

  /**
   * @notice Change strategy of a vault to the previously proposed strategy.
   * @param _vaults - addresses of the vaults
   */
  function changeVaultStrategy(address[] memory _vaults) external {
    for (uint256 i = 0; i < _vaults.length; i++) {
      IVault(_vaults[i]).changeStrategy();
    }
  }

  /**
   * @notice Sets different fees per vault
   * @param _vaults - addresses of the vaults to change
   * @param _newFees - new fee structures for these vaults
   * @dev Value is in 1e18, e.g. 100% = 1e18 - 1 BPS = 1e12
   * @dev index of _vaults array and _newFees must coincide
   */
  function setVaultFees(address[] memory _vaults, IVault.FeeStructure[] memory _newFees) external {
    for (uint8 i; i < _vaults.length; i++) {
      _verifySubmitter(_vaults[i]);
      IVault(_vaults[i]).setFees(_newFees[i]);
    }
  }

  /**
   * @notice Sets keeperConfig for a vault
   * @param _vaults - addresses of the newly deployed vaults
   * @param _keeperConfigs - the keeperConfig structs from the VaultParams used in vault deployment
   * @dev index of _vaults array and _keeperConfigs must coincide
   */
  function setVaultKeeperConfig(address[] memory _vaults, KeeperConfig[] memory _keeperConfigs) external {
    for (uint256 i = 0; i < _vaults.length; i++) {
      _verifySubmitter(_vaults[i]);
      IVault(_vaults[i]).setKeeperConfig(_keeperConfigs[i]);
    }
  }

  function _verifySubmitter(address vault) internal returns (VaultMetadata memory) {
    VaultMetadata memory metadata = _vaultsRegistry().getVault(vault);
    if (msg.sender != metadata.submitter) revert NotSubmitter(msg.sender);
    return metadata;
  }

  /*//////////////////////////////////////////////////////////////
                          ENDORSEMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  /**
   * @notice switches whether a vault is endorsed or unendorsed
   * @param _vaultAddresses - addresses of the vaults to change endorsement
   */
  function toggleEndorsement(address[] memory _vaultAddresses) external onlyOwner {
    VaultsRegistry vaultsRegistry = _vaultsRegistry();
    for (uint256 i = 0; i < _vaultAddresses.length; i++) {
      vaultsRegistry.toggleEndorseVault(_vaultAddresses[i]);
    }
  }

  /*//////////////////////////////////////////////////////////////
                          STAKING MANAGEMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  // NOTE - currently checks submitter of stakingRewardsToken not submitter of vault
  function addRewardsToken(address[] memory _stakingContracts, bytes[] memory rewardsTokenData) external {
    for (uint256 i = 0; i < _stakingContracts.length; i++) {
      (
        address rewardsToken,
        uint160 rewardsPerSecond,
        uint256 amount,
        address submitter,
        bool useEscrow,
        uint224 escrowDuration,
        uint24 escrowPercentage,
        uint256 offset
      ) = abi.decode(rewardsTokenData, (address, uint160, uint256, address, bool, uint224, uint24, uint256));
      IMultiRewardsStaking(_stakingContracts[i]).addRewardsToken(
        IERC20(rewardsToken),
        rewardsPerSecond,
        amount,
        submitter,
        useEscrow,
        escrowDuration,
        escrowPercentage,
        offset
      );
    }
  }

  function changeRewardsSpeed(address[] memory _stakingContracts, bytes[] memory rewardsTokenData) external {
    for (uint256 i = 0; i < _stakingContracts.length; i++) {
      (address rewardsToken, uint160 rewardsPerSecond, address submitter) = abi.decode(
        rewardsTokenData,
        (address, uint160, address)
      );
      IMultiRewardsStaking(_stakingContracts[i]).changeRewardSpeed(IERC20(rewardsToken), rewardsPerSecond, submitter);
    }
  }

  function fundReward(address[] memory _stakingContracts, bytes[] memory rewardsTokenData) external {
    for (uint256 i = 0; i < _stakingContracts.length; i++) {
      (address rewardsToken, uint256 amount) = abi.decode(rewardsTokenData, (address, uint256));
      IMultiRewardsStaking(_stakingContracts[i]).fundReward(IERC20(rewardsToken), amount);
    }
  }

  /*//////////////////////////////////////////////////////////////
                          ESCROW MANAGEMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  function setEscrowTokenFee(IERC20[] memory tokens, uint256[] memory fees) external onlyOwner {
    IMultiRewardsEscrow(_getContract(MULTI_REWARD_ESCROW)).setFees(tokens, fees);
  }

  function setEscrowKeeperPerc(uint256 keeperPerc) external onlyOwner {
    IMultiRewardsEscrow(_getContract(MULTI_REWARD_ESCROW)).setKeeperPerc(keeperPerc);
  }

  /*//////////////////////////////////////////////////////////////
                          FACTORY MANAGEMENT LOGIC
    //////////////////////////////////////////////////////////////*/

  function addTemplateType(bytes32[] memory templateTypes) external onlyOwner {
    IVaultsFactory factory = IVaultsFactory(_getContract(VAULT_FACTORY));
    uint8 len = templateTypes.length;
    for (uint256 i = 0; i < len; i++) {
      factory.addTemplateType(templateTypes[i]);
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
      address adapter = IVault(vaults[i]).strategy();
      IVault(adapter).pause();
    }
  }

  function pauseVault(address[] calldata vaults) external {
    uint8 len = vaults.length;
    for (uint256 i = 0; i < len; i++) {
      _verifySubmitterOrOwner(vaults[i]);
      IVault(contracts[i]).pause();
    }
  }

  function unpauseAdapter(address[] calldata vaults) external {
    uint8 len = vaults.length;
    for (uint256 i = 0; i < len; i++) {
      _verifySubmitterOrOwner(vaults[i]);
      address adapter = IVault(vaults[i]).strategy();
      IVault(adapter).unpause();
    }
  }

  function unpauseVault(address[] calldata vaults) external {
    uint8 len = vaults.length;
    for (uint256 i = 0; i < len; i++) {
      _verifySubmitterOrOwner(vaults[i]);
      IVault(contracts[i]).unpause();
    }
  }

  function _verifySubmitterOrOwner(address vault) internal returns (VaultMetadata memory) {
    VaultMetadata memory metadata = _vaultsRegistry().getVault(vault);
    if (msg.sender != metadata.submitter || msg.sender != owner) revert NotSubmitterNorOwner(msg.sender);
    return metadata;
  }

  /*//////////////////////////////////////////////////////////////
                          OWNERSHIP LOGIC
    //////////////////////////////////////////////////////////////*/

  /**
   * @notice transfers ownership of VaultRegistry and VaultsV1Factory contracts from controller
   * @dev newOwner address must call acceptOwnership on registry and factory
   */
  function transferOwnership(address[] contracts, address newOwner) external onlyOwner {
    uint8 len = contracts.length;
    for (uint8 i; i < len; i++) {
      IContractFactory(contracts[i]).nominateNewOwner(newOwner);
    }
  }

  /**
   * @notice transfers ownership of VaultRegistry and VaultsV1Factory contracts to controller
   * @dev registry and factory must nominate controller as new owner first
   * acceptance function should be called when deploying controller contract
   */
  function acceptOwnership(address[] contracts) external onlyOwner {
    uint8 len = contracts.length;
    for (uint8 i; i < len; i++) {
      IContractFactory(contracts[i]).acceptOwnership();
    }
  }

  /*//////////////////////////////////////////////////////////////
                      CONTRACT REGISTRY LOGIC
  //////////////////////////////////////////////////////////////*/

  bytes32 internal constant VAULT_REWARDS_ESCROW = keccak256("VaultRewardsEscrow");
  bytes32 internal constant VAULT_REGISTRY = keccak256("VaultsRegistry");
  bytes32 internal constant VAULT_FACTORY = keccak256("VaultsFactory");
  bytes32 internal constant MULTI_REWARD_ESCROW = keccak256("MultiRewardsEscrow");

  /**
   * @notice helper function to get VaultsRegistry contract
   */
  function _vaultsRegistry() private view returns (VaultsRegistry) {
    return VaultsRegistry(_getContract(VAULT_REGISTRY));
  }

  /**
   * @notice helper function to get VaultsFactory contract
   */
  function _vaultsFactory() private view returns (VaultsFactory) {
    return VaultsFactory(_getContract(VAULT_FACTORY));
  }

  /**
   * @notice Override for ContractRegistryAccess.
   */
  function _getContract(bytes32 _name) internal view override(ContractRegistryAccess) returns (address) {
    return super._getContract(_name);
  }
}
