// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../../../contracts/core/utils/ContractRegistry.sol";
import "../../../contracts/core/utils/ACLRegistry.sol";
import "../../../contracts/core/utils/KeeperIncentiveV2.sol";

import "../../../contracts/core/dao/Staking.sol";
import "../../../contracts/core/interfaces/IStaking.sol";

import "../../../contracts/core/interfaces/IRewardsEscrow.sol";
import "../../../contracts/core/dao/RewardsEscrow.sol";

import { ButterBatchProcessing } from "../../../contracts/core/defi/butter/ButterBatchProcessing.sol";
import { ButterBatchProcessingZapper } from "../../../contracts/core/defi/butter/ButterBatchProcessingZapper.sol";
import { ButterWhaleProcessing } from "../../../contracts/core/defi/butter/ButterWhaleProcessing.sol";
// import "../../interfaces/IBatchStorage.sol";

import { ThreeXBatchProcessing, IOracle } from "../../../contracts/core/defi/three-x/ThreeXBatchProcessing.sol";
import { ThreeXWhaleProcessing } from "../../../contracts/core/defi/three-x/ThreeXWhaleProcessing.sol";
import { ThreeXBatchVault } from "../../../contracts/core/defi/three-x/ThreeXBatchVault.sol";
import { AbstractBatchController } from "../../../contracts/core/defi/three-x/controller/AbstractBatchController.sol";
import { AbstractBatchStorage } from "../../../contracts/core/defi/three-x/storage/AbstractBatchStorage.sol";
import "../../../contracts/core/interfaces/IBatchStorage.sol";

import { Vault } from "../../../contracts/core/defi/vault/Vault.sol";
import { VaultParams, VaultsV1Factory } from "../../../contracts/core/defi/vault/VaultsV1Factory.sol";
import { VaultFeeController } from "../../../contracts/core/defi/vault/VaultFeeController.sol";
import "../../../contracts/core/defi/vault/VaultsV1Controller.sol";

import "../../../contracts/externals/interfaces/Curve3Pool.sol";
import "../../../contracts/externals/interfaces/ISetToken.sol";
import "../../../contracts/externals/interfaces/CurveContracts.sol";
import "../../../contracts/externals/interfaces/IBasicIssuanceModule.sol";
import "../../../contracts/externals/interfaces/IAngleRouter.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "forge-std/StdJson.sol";
import "forge-std/Test.sol";
import { console } from "forge-std/console.sol";

// This contract can be used for deployments as well as forge tests
abstract contract AbstractTestScript is Test {
  using stdJson for string;
  using SafeERC20 for IERC20;
  using SafeERC20 for ERC20;

  string root = vm.projectRoot();
  string path = string.concat(root, "/lib/utils/namedAccounts.json");
  string json = vm.readFile(path);

  ButterBatchProcessing.CurvePoolTokenPair[] public crvDependencies;
  ButterWhaleProcessing.CurvePoolTokenPair[] public crvDependenciesWhale;
  mapping(string => IERC20) public erc20Contracts;
  mapping(string => IStaking) public stakingContracts;
  mapping(string => Vault) public vaultContracts;

  address constant ACL_ADMIN = 0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f;

  ContractRegistry public contractRegistry;
  IACLRegistry public aclRegistry;
  KeeperIncentiveV2 public keeperIncentiveV2;

  ISetToken public butter;
  ButterBatchProcessing public butterBatchProcessing;
  ButterBatchProcessingZapper public butterBatchProcessingZapper;
  ButterWhaleProcessing public butterWhaleProcessing;

  ISetToken public threeX;
  ThreeXBatchProcessing public threeXBatchProcessing;
  ThreeXWhaleProcessing public threeXWhaleProcessing;
  ThreeXBatchVault public threeXBatchVault = ThreeXBatchVault(getMainnetContractAddress("threeXBatchVault"));

  ThreeXBatchProcessing.ComponentDependencies[] public componentDependencies3X;
  BatchTokens public mintBatchTokens;
  BatchTokens public redeemBatchTokens;

  Vault public vault;
  VaultsV1Controller public vaultsV1Controller;
  VaultsV1Registry public vaultsV1Registry;
  VaultsV1Factory public vaultsV1Factory;
  VaultFeeController internal feeController;
  VaultParams public vaultParams;
  address public vaultAssetAddress = getMainnetContractAddress("crv3Crypto");
  address public vaultsV1ControllerOwner = address(this);
  address[8] public swapTokenAddresses;
  address constant CURVE_ZAP_IN = 0x5Ce9b49B7A1bE9f2c3DC2B2A5BaCEA56fa21FBeE;
  address constant CURVE_ZAP_OUT = 0xE03A338d5c305613AfC3877389DD3B0617233387;
  uint256 constant DEPOSIT_FEE = 50 * 1e14;
  uint256 constant WITHDRAWAL_FEE = 50 * 1e14;
  uint256 constant MANAGEMENT_FEE = 200 * 1e14;
  uint256 constant PERFORMANCE_FEE = 2000 * 1e14;
  address public notOwner = address(0x1234);

  IERC20 public threeCrv = IERC20(getMainnetContractAddress("threeCrv"));
  CurveMetapool public curveMetaPool = CurveMetapool(getMainnetContractAddress("threePool"));
  Curve3Pool public curve3Pool = Curve3Pool(getMainnetContractAddress("threePool"));
  IBasicIssuanceModule public setBasicIssuanceModule =
    IBasicIssuanceModule(getMainnetContractAddress("setBasicIssuanceModule"));
  IRewardsEscrow public rewardsEscrow = RewardsEscrow(getMainnetContractAddress("rewardsEscrow"));

  address[] public yTokenAddresses = [
    getMainnetContractAddress("yFrax"),
    getMainnetContractAddress("yRai"),
    getMainnetContractAddress("yMusd"),
    getMainnetContractAddress("yAlusd")
  ];

  function instantiateOrDeployRegistryContracts(bool _instantiate) public {
    if (_instantiate) {
      aclRegistry = ACLRegistry(getMainnetContractAddress("aclRegistry"));
      contractRegistry = ContractRegistry(getMainnetContractAddress("contractRegistry"));
      keeperIncentiveV2 = KeeperIncentiveV2(getMainnetContractAddress("keeperIncentive"));
    } else {
      vm.startPrank(ACL_ADMIN);
      aclRegistry = new ACLRegistry();
      grantRole("DAO", ACL_ADMIN);
      grantRole("KEEPER", ACL_ADMIN);
      grantRole("INCENTIVE_MANAGER_ROLE", ACL_ADMIN);

      contractRegistry = new ContractRegistry(aclRegistry);
      keeperIncentiveV2 = new KeeperIncentiveV2(contractRegistry, 0, 0);

      addContract("KeeperIncentive", address(keeperIncentiveV2), "1");
      vm.stopPrank();
    }

    vm.label(address(keeperIncentiveV2), "KeeperIncentive");
    vm.label(address(aclRegistry), "ACLRegistry");
    vm.label(address(contractRegistry), "contractRegistry");
  }

  function instantiateOrDeployERC20(bool _instantiate, string[] memory keys) public {
    for (uint256 j = 0; j < keys.length; j++) {
      if (_instantiate) {
        erc20Contracts[keys[j]] = IERC20(getMainnetContractAddress(keys[j]));
      } else {
        erc20Contracts[keys[j]] = IERC20(address(new ERC20(keys[j], keys[j])));
        addContract(keys[j], address(erc20Contracts[keys[j]]), "1");
      }
    }
  }

  function getERC20Contract(string memory key) public returns (IERC20) {
    IERC20 erc20Contract = erc20Contracts[key];
    if (address(erc20Contract) == address(0)) {
      return IERC20(getMainnetContractAddress(key));
    }
    return erc20Contract;
  }

  function instantiateOrDeployStaking(bool _instantiate, string[] memory keys) public {
    for (uint256 j = 0; j < keys.length; j++) {
      if (_instantiate) {
        stakingContracts[keys[j]] = IStaking(getMainnetContractAddress(keys[j]));
      } else {
        stakingContracts[keys[j]] = IStaking(
          address(new Staking(getERC20Contract("pop"), getERC20Contract(keys[j]), rewardsEscrow))
        );
        addContract(keys[j], address(stakingContracts[keys[j]]), "1");
      }
    }
  }

  function getStakingContract(string memory key) public returns (IStaking) {
    IStaking stakingContract = stakingContracts[key];
    if (address(stakingContract) == address(0)) {
      return IStaking(getMainnetContractAddress(key));
    }
    return stakingContract;
  }

  function instantiateOrDeployVault(
    bool _instantiate,
    bool _deployFromController,
    string memory key,
    bool _endorsed
  ) public {
    if (_instantiate) {
      vault = Vault(getMainnetContractAddress(key));
      vaultsV1Factory = VaultsV1Factory(getMainnetContractAddress("vaultsV1Factory"));
      vaultsV1Registry = VaultsV1Registry(getMainnetContractAddress("vaultsV1Registry"));
      vaultsV1Controller = VaultsV1Controller(getMainnetContractAddress("vaultsV1Controller"));
    } else {
      vaultAssetAddress = address(getERC20Contract(key)); // This has the flexibility of instantiating if we havent deployed this contract or picking up the deployed ERC20 if it we have deployed in this script

      vaultsV1Factory = new VaultsV1Factory(address(this));
      vaultsV1Registry = new VaultsV1Registry(address(this));
      vaultsV1Controller = new VaultsV1Controller(address(this), contractRegistry);

      addContract("VaultsV1Factory", address(vaultsV1Factory), "1");
      addContract("VaultsV1Registry", address(vaultsV1Registry), "1");
      addContract("VaultsV1Controller", address(vaultsV1Controller), "1");
      grantRole("VaultsController", address(vaultsV1Controller));
      grantRole("INCENTIVE_MANAGER_ROLE", address(vaultsV1Controller));

      vm.label(address(this), "VaultsV1ControllerOwner");
      vm.label(notOwner, "notOwner");
      vm.label(address(vaultsV1Controller), "VaultsV1Controller");
      vm.label(address(vaultsV1Factory), "VaultsV1Factory");

      for (uint256 i = 0; i < 8; i++) {
        swapTokenAddresses[i] = address(uint160(i));
      }
      vaultParams = VaultParams({
        token: vaultAssetAddress,
        yearnRegistry: getMainnetContractAddress("yearnRegistry"),
        contractRegistry: contractRegistry,
        staking: address(0),
        feeStructure: Vault.FeeStructure({
          deposit: DEPOSIT_FEE,
          withdrawal: WITHDRAWAL_FEE,
          management: MANAGEMENT_FEE,
          performance: PERFORMANCE_FEE
        }),
        keeperConfig: Vault.KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1, keeperPayout: 9 }),
        enabled: true,
        stakingAddress: address(0x1111),
        submitter: vaultsV1ControllerOwner,
        metadataCID: "someCID",
        swapTokenAddresses: swapTokenAddresses,
        swapAddress: address(0x2222),
        exchange: 1,
        zapIn: CURVE_ZAP_IN,
        zapOut: CURVE_ZAP_OUT
      });

      if (_deployFromController) {
        address deployedVault = vaultsV1Controller.deployVaultFromV1Factory(vaultParams, _endorsed);
        VaultMetadata memory metadata = vaultsV1Registry.getVault(deployedVault);
        vaultContracts[key] = Vault(deployedVault);
      } else {
        vault = new Vault(
          vaultAssetAddress,
          getMainnetContractAddress("yearnRegistry"),
          contractRegistry,
          address(0),
          Vault.FeeStructure({
            deposit: DEPOSIT_FEE,
            withdrawal: WITHDRAWAL_FEE,
            management: MANAGEMENT_FEE,
            performance: PERFORMANCE_FEE
          }),
          Vault.KeeperConfig({ minWithdrawalAmount: 100, incentiveVigBps: 1, keeperPayout: 9 })
        );
        vaultContracts[key] = vault;
        feeController = new VaultFeeController(
          VaultFeeController.FeeStructure({
            deposit: DEPOSIT_FEE,
            withdrawal: WITHDRAWAL_FEE,
            management: MANAGEMENT_FEE,
            performance: PERFORMANCE_FEE
          }),
          contractRegistry
        );
        addContract("VaultFeeController", address(feeController), "1");
      }
    }
  }

  function getVault(string memory key) public returns (Vault) {
    Vault vault = vaultContracts[key];
    if (address(vault) == address(0)) {
      return Vault(getMainnetContractAddress(key));
    }
    return vault;
  }

  function instantiateOrDeployButter(bool _instantiate) public {
    if (_instantiate) {
      butter = ISetToken(getMainnetContractAddress("butter"));
      butterBatchProcessing = ButterBatchProcessing(getMainnetContractAddress("butterBatch"));
      butterBatchProcessingZapper = ButterBatchProcessingZapper(getMainnetContractAddress("butterBatchZapper"));
      butterWhaleProcessing = ButterWhaleProcessing(getMainnetContractAddress("butterWhaleProcessing"));
    } else {
      crvDependencies.push(
        ButterBatchProcessing.CurvePoolTokenPair(
          CurveMetapool(getMainnetContractAddress("crvFraxMetapool")),
          IERC20(getMainnetContractAddress("crvFrax"))
        )
      );
      crvDependencies.push(
        ButterBatchProcessing.CurvePoolTokenPair(
          CurveMetapool(getMainnetContractAddress("crvRaiMetapool")),
          IERC20(getMainnetContractAddress("crvRai"))
        )
      );
      crvDependencies.push(
        ButterBatchProcessing.CurvePoolTokenPair(
          CurveMetapool(getMainnetContractAddress("crvMusdMetapool")),
          IERC20(getMainnetContractAddress("crvMusd"))
        )
      );
      crvDependencies.push(
        ButterBatchProcessing.CurvePoolTokenPair(
          CurveMetapool(getMainnetContractAddress("crvAlusdMetapool")),
          IERC20(getMainnetContractAddress("crvAlusd"))
        )
      );

      crvDependenciesWhale.push(
        ButterWhaleProcessing.CurvePoolTokenPair(
          CurveMetapool(getMainnetContractAddress("crvMusdMetapool")),
          IERC20(getMainnetContractAddress("crvMusd"))
        )
      );
      crvDependenciesWhale.push(
        ButterWhaleProcessing.CurvePoolTokenPair(
          CurveMetapool(getMainnetContractAddress("crvAlusdMetapool")),
          IERC20(getMainnetContractAddress("crvAlusd"))
        )
      );

      butter = ISetToken(address(new ERC20("Butter", "BTR")));
      butterBatchProcessing = new ButterBatchProcessing(
        contractRegistry,
        getStakingContract("butter"),
        butter,
        threeCrv,
        curveMetaPool,
        setBasicIssuanceModule,
        yTokenAddresses,
        crvDependencies,
        ButterBatchProcessing.ProcessingThreshold(1 ether, 1 ether, 1e17)
      );

      butterBatchProcessing.setSlippage(7, 200);
      butterBatchProcessing.setApprovals();
      createIncentive(address(butterBatchProcessing), 0, true, false, address(getERC20Contract("pop")), 1, 0);
      addContract("ButterBatchProcessing", address(butterBatchProcessing), "");

      butterBatchProcessingZapper = new ButterBatchProcessingZapper(contractRegistry, curve3Pool, threeCrv);
      butterBatchProcessingZapper.setApprovals();

      grantRole("ApprovedContract", address(butterBatchProcessingZapper));
      grantRole("ButterZapper", address(butterBatchProcessingZapper));

      butterWhaleProcessing = new ButterWhaleProcessing(
        contractRegistry,
        getStakingContract("butter"),
        butter,
        threeCrv,
        curve3Pool,
        setBasicIssuanceModule,
        yTokenAddresses,
        crvDependenciesWhale
      );
      butterWhaleProcessing.setApprovals();
    }
  }

  address[] public tokensFor3X;

  function instantiateOrDeploy3X(bool _instantiate) public {
    if (_instantiate) {
      threeX = ISetToken(getMainnetContractAddress("threeX"));
      threeXBatchProcessing = ThreeXBatchProcessing(getMainnetContractAddress("threeXBatch"));
      threeXWhaleProcessing = ThreeXWhaleProcessing(getMainnetContractAddress("threeXWhale"));
    } else {
      threeX = ISetToken(address(new ERC20("ThreeX", "3X")));

      mintBatchTokens = BatchTokens({ sourceToken: getERC20Contract("usdc"), targetToken: threeX });
      redeemBatchTokens = BatchTokens({ targetToken: getERC20Contract("usdc"), sourceToken: threeX });
      componentDependencies3X.push(
        ThreeXBatchProcessing.ComponentDependencies({
          lpToken: IERC20(getMainnetContractAddress("crvSusd")),
          utilityPool: CurveMetapool(getMainnetContractAddress("crvSusdUtilityPool")),
          oracle: IOracle(address(0)),
          curveMetaPool: CurveMetapool(getMainnetContractAddress("crvSusdMetapool")),
          angleRouter: IAngleRouter(address(0))
        })
      );
      componentDependencies3X.push(
        ThreeXBatchProcessing.ComponentDependencies({
          lpToken: IERC20(getMainnetContractAddress("crv3Eur")),
          utilityPool: CurveMetapool(address(0)),
          oracle: IOracle(getMainnetContractAddress("eurOracle")),
          curveMetaPool: CurveMetapool(getMainnetContractAddress("crv3EurMetapool")),
          angleRouter: IAngleRouter(getMainnetContractAddress("angleRouter"))
        })
      );

      threeXWhaleProcessing = new ThreeXWhaleProcessing(
        contractRegistry,
        setBasicIssuanceModule,
        getStakingContract("threeXStaking"),
        curve3Pool,
        [getERC20Contract("dai"), getERC20Contract("usdc"), getERC20Contract("usdt")]
      );

      threeXWhaleProcessing.setApprovals();
      vm.startPrank(ACL_ADMIN);
      vm.warp(block.timestamp - 3 days);
      threeXBatchProcessing.grantClientAccess(address(threeXWhaleProcessing));
      vm.warp(block.timestamp + 3 days);
      threeXBatchVault.addClient(address(threeXWhaleProcessing));
      threeXWhaleProcessing.setBatchStorage(AbstractBatchStorage(address(threeXBatchVault)));
      threeXWhaleProcessing.acceptClientAccess(address(threeXBatchVault));
      threeXWhaleProcessing.setFee("mint", 0, address(0), threeX);
      threeXWhaleProcessing.setFee("redeem", 0, address(0), getERC20Contract("usdc"));
      grantRole("ApprovedContract", address(this));
      grantRole("ApprovedContract", address(threeXWhaleProcessing));
      grantRole("Keeper", address(threeXWhaleProcessing));
      vm.stopPrank();

      tokensFor3X.push(getMainnetContractAddress("ySusd"));
      tokensFor3X.push(getMainnetContractAddress("y3Eur"));
      threeXBatchProcessing = new ThreeXBatchProcessing(
        contractRegistry,
        getStakingContract("threeXStaking"),
        mintBatchTokens,
        redeemBatchTokens,
        setBasicIssuanceModule,
        tokensFor3X,
        componentDependencies3X,
        IERC20(getMainnetContractAddress("agEur")),
        AbstractBatchController.ProcessingThreshold({
          batchCooldown: 1800,
          mintThreshold: 20000 ether,
          redeemThreshold: 200 ether
        })
      );
      threeXBatchProcessing.setBatchStorage(AbstractBatchStorage(address(threeXBatchVault)));
      threeXBatchProcessing.setApprovals();
      createIncentive(address(threeXBatchProcessing), 0, true, false, address(getERC20Contract("pop")), 1, 0);
      threeXBatchProcessing.setSlippage(100, 100);
    }
  }

  // Make sure you include the --rpc-url for mainnet forking
  function getMainnetContractAddress(string memory _contractKey) public returns (address) {
    string memory fullKey = string.concat(".", _contractKey, ".mainnet");
    return json.readAddress(fullKey);
  }

  function grantRole(string memory _role, address _account) public {
    vm.prank(ACL_ADMIN);
    aclRegistry.grantRole(keccak256(abi.encode(_role)), _account);
  }

  function addContract(
    string memory _name,
    address _account,
    string memory _version
  ) public {
    vm.prank(ACL_ADMIN);
    contractRegistry.addContract(keccak256(abi.encode(_name)), _account, keccak256(abi.encode(_version)));
  }

  function createIncentive(
    address _address,
    uint256 _reward,
    bool _enabled,
    bool _openToEveryone,
    address _rewardToken,
    uint256 _cooldown,
    uint256 _burnPercentage
  ) public {
    vm.prank(ACL_ADMIN);
    keeperIncentiveV2.createIncentive(
      _address,
      _reward,
      _enabled,
      _openToEveryone,
      _rewardToken,
      _cooldown,
      _burnPercentage
    );
  }
}
