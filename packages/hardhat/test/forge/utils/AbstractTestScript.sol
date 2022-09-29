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
import { AbstractBatchController } from "../../../contracts/core/defi/three-x/controller/AbstractBatchController.sol";
import "../../../contracts/core/interfaces/IBatchStorage.sol";

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

  ThreeXBatchProcessing.ComponentDependencies[] public componentDependencies3X;
  BatchTokens public mintBatchTokens;
  BatchTokens public redeemBatchTokens;

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

  function instantiateOrDeployStaking(bool _instantiate, string[] memory keys) public {
    for (uint256 j = 0; j < keys.length; j++) {
      if (_instantiate) {
        stakingContracts[keys[j]] = IStaking(getMainnetContractAddress(keys[j]));
      } else {
        stakingContracts[keys[j]] = IStaking(
          address(new Staking(erc20Contracts["pop"], erc20Contracts[keys[j]], rewardsEscrow))
        );
        addContract(keys[j], address(stakingContracts[keys[j]]), "1");
      }
    }
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
        stakingContracts["butter"],
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
      createIncentive(address(butterBatchProcessing), 0, true, false, address(erc20Contracts["pop"]), 1, 0);
      addContract("ButterBatchProcessing", address(butterBatchProcessing), "");

      butterBatchProcessingZapper = new ButterBatchProcessingZapper(contractRegistry, curve3Pool, threeCrv);
      butterBatchProcessingZapper.setApprovals();

      grantRole("ApprovedContract", address(butterBatchProcessingZapper));
      grantRole("ButterZapper", address(butterBatchProcessingZapper));

      butterWhaleProcessing = new ButterWhaleProcessing(
        contractRegistry,
        stakingContracts["butter"],
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
      mintBatchTokens = BatchTokens({ sourceToken: erc20Contracts["usdc"], targetToken: threeX });
      redeemBatchTokens = BatchTokens({ targetToken: erc20Contracts["usdc"], sourceToken: threeX });

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
        stakingContracts["threeXStaking"],
        curve3Pool,
        [erc20Contracts["dai"], erc20Contracts["usdc"], erc20Contracts["usdt"]]
      );
      threeXWhaleProcessing.setApprovals();

      tokensFor3X.push(getMainnetContractAddress("ySusd"));
      tokensFor3X.push(getMainnetContractAddress("y3Eur"));
      threeXBatchProcessing = new ThreeXBatchProcessing(
        contractRegistry,
        stakingContracts["threeXStaking"],
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
