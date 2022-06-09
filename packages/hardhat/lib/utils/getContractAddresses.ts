import { ContractAddresses } from "../../../utils/src/types";
import { getNamedAccountsByChainId } from "./getNamedAccounts";

const butterDependencyContractNames = [
  "yFrax",
  "yMim",
  "crvFrax",
  "crvMim",
  "crvFraxMetapool",
  "crvMimMetapool",
  "threePool",
  "curveAddressProvider",
  "curveFactoryMetapoolDepositZap",
  "uniswapRouter",
  "setBasicIssuanceModule",
  "setTokenCreator",
  "setStreamingFeeModule",
];

const stakingContractNames = ["butterStaking", "popUsdcLpStaking", "threeXStaking"];

export const mapAccountsFromNamedAccounts = (chainId): ContractAddresses => {
  let contracts: ContractAddresses;
  const contractsForSelectedNetwork = getNamedAccountsByChainId(chainId);
  contracts = Object.keys(contractsForSelectedNetwork).reduce(
    (result, contract) => {
      if (stakingContractNames.includes(contract)) {
        result["staking"]
          ? result["staking"].push(contractsForSelectedNetwork[contract])
          : (result["staking"] = [contractsForSelectedNetwork[contract]]);
      } else if (butterDependencyContractNames.includes(contract)) {
        result["butterDependency"]
          ? (result["butterDependency"][contract] = contractsForSelectedNetwork[contract])
          : (result["butterDependency"] = {
              [contract]: contractsForSelectedNetwork[contract],
            });
      }
      result[contract] = contractsForSelectedNetwork[contract];
      result.all.add(contractsForSelectedNetwork[contract].toLowerCase());

      return result;
    },
    {
      all: new Set(),
      has: function (contractAddress?: string) {
        return this.all.has(contractAddress?.toLowerCase());
      },
    } as ContractAddresses
  );
  return contracts;
};
export function getChainRelevantContracts(chainId): ContractAddresses {
  return mapAccountsFromNamedAccounts(chainId);
}
