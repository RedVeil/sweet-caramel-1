import {
  butterDependencyContractNames,
  stakingContractNames,
} from "../../../utils/src/constants";
import { ContractAddresses } from "../../../utils/src/types";
import { getNamedAccountsByChainId } from "./getNamedAccounts";

export const mapAccountsFromNamedAccounts = (chainId): ContractAddresses => {
  let contracts: ContractAddresses;
  const contractsForSelectedNetwork = getNamedAccountsByChainId(chainId);
  contracts = Object.keys(contractsForSelectedNetwork).reduce(
    (result, contract) => {
      if (stakingContractNames[contract] === 1) {
        result["staking"]
          ? result["staking"].push(contractsForSelectedNetwork[contract])
          : (result["staking"] = [contractsForSelectedNetwork[contract]]);
      } else if (butterDependencyContractNames[contract] === 1) {
        result["butterDependency"]
          ? (result["butterDependency"][contract] =
              contractsForSelectedNetwork[contract])
          : (result["butterDependency"] = {
              [contract]: contractsForSelectedNetwork[contract],
            });
      } else {
        result[contract] = contractsForSelectedNetwork[contract];
      }

      return result;
    },
    {} as ContractAddresses
  );
  return contracts;
};
export function getChainRelevantContracts(chainId): ContractAddresses {
  return mapAccountsFromNamedAccounts(chainId);
}
