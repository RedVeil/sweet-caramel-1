// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../../../contracts/core/utils/ContractRegistry.sol";
import "../../../contracts/core/utils/ACLRegistry.sol";
import "../../../contracts/core/utils/KeeperIncentiveV2.sol";

import "../../../contracts/core/dao/Staking.sol";
import "../../../contracts/core/interfaces/IStaking.sol";

import "../../../contracts/core/interfaces/IRewardsEscrow.sol";
import "../../../contracts/core/dao/RewardsEscrow.sol";

import "../../../contracts/core/defi/butter/ButterBatchProcessing.sol";
import "../../../contracts/core/defi/butter/ButterBatchProcessingZapper.sol";
import "../../../contracts/core/defi/butter/ButterWhaleProcessing.sol";
import "../../../contracts/core/interfaces/IButterBatchProcessing.sol";

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
  mapping(string => IERC20) public erc20Contracts;
  mapping(string => IStaking) public stakingContracts;

  address constant ACL_ADMIN = 0x92a1cB552d0e177f3A135B4c87A4160C8f2a485f;

  ContractRegistry public contractRegistry;
  IACLRegistry public aclRegistry;
  KeeperIncentiveV2 public keeperIncentiveV2;
  IStaking public staking;
  ISetToken public setToken;
  IERC20 public pop;
  ISetToken public butter;
  IButterBatchProcessing public butterBatchProcessing;
  ButterBatchProcessingZapper public butterBatchProcessingZapper;
  ButterWhaleProcessing public butterWhaleProcessing;

  IERC20 public threeCrv = IERC20(getMainnetContractAddress("threeCrv"));
  CurveMetapool public threePool = CurveMetapool(getMainnetContractAddress("threePool"));
  IBasicIssuanceModule public setBasicIssuanceModule =
    IBasicIssuanceModule(getMainnetContractAddress("setBasicIssuanceModule"));
  address[] public yTokenAddresses = [
    getMainnetContractAddress("yFrax"),
    getMainnetContractAddress("yRai"),
    getMainnetContractAddress("yMusd"),
    getMainnetContractAddress("yAlusd")
  ];
  IRewardsEscrow public rewardsEscrow = RewardsEscrow(getMainnetContractAddress("rewardsEscrow"));

  function instantiateOrDeployRegistryContracts(bool _instantiate) public {
    if (_instantiate) {
      aclRegistry = ACLRegistry(getMainnetContractAddress("aclRegistry"));
      contractRegistry = ContractRegistry(getMainnetContractAddress("contractRegistry"));
      keeperIncentiveV2 = KeeperIncentiveV2(getMainnetContractAddress("keeperIncentive"));
    } else {
      vm.startPrank(ACL_ADMIN);
      aclRegistry = new ACLRegistry();
      contractRegistry = new ContractRegistry(aclRegistry);
      keeperIncentiveV2 = new KeeperIncentiveV2(contractRegistry, 0, 0);
      vm.stopPrank();
    }
  }

  function instantiateOrDeployERC20(bool _instantiate, string[] memory keys) public {
    for (uint256 j = 0; j < keys.length; j++) {
      if (_instantiate) {
        erc20Contracts[keys[j]] = IERC20(getMainnetContractAddress(keys[j]));
      } else {
        erc20Contracts[keys[j]] = new ERC20(keys[j], keys[j]);
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
      }
    }
  }

  function instantiateOrDeployButter(bool _instantiate) public {
    if (_instantiate) {
      butter = ISetToken(getMainnetContractAddress("butter"));
      butterBatchProcessing = IButterBatchProcessing(getMainnetContractAddress("butterBatch"));
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

      butterBatchProcessing = IButterBatchProcessing(
        address(
          new ButterBatchProcessing(
            contractRegistry,
            stakingContracts["butter"],
            butter,
            threeCrv,
            threePool,
            setBasicIssuanceModule,
            yTokenAddresses,
            crvDependencies,
            ButterBatchProcessing.ProcessingThreshold(1e18, 1e18, 1e17)
          )
        )
      );
    }
  }

  // Make sure you include the --rpc-url for mainnet forking
  function getMainnetContractAddress(string memory _contractKey) public returns (address) {
    string memory fullKey = string.concat(".", _contractKey, ".mainnet");
    return json.readAddress(fullKey);
  }
}
