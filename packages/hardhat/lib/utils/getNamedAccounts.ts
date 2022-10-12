import { networkMap } from "@popcorn/utils/src/connectors";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import namedAccounts from "./namedAccounts.json";

export const getNamedAccountsFromNetwork = (hre: HardhatRuntimeEnvironment) => {
  return Object.keys(namedAccounts).reduce((map, contract) => {
    if (!namedAccounts[contract][hre.network.name]) return map;
    return {
      ...map,
      [contract]: namedAccounts[contract][hre.network.name],
    };
  }, {} as any);
};

export const getNamedAccountsByChainId = (chainId: number) => {
  const network: string = networkMap[chainId] ? networkMap[chainId].toLowerCase() : "hardhat";
  return Object.keys(namedAccounts).reduce((map, contract) => {
    if (!namedAccounts[contract][network]) return map;
    return {
      ...map,
      [contract]: namedAccounts[contract][network],
    };
  }, {} as any);
};
