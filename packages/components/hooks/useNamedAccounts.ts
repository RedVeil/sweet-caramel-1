import { useMemo } from "react";
import { DeploymentChainIds, DeploymentContractsKeys, getNamedAccounts } from "@popcorn/utils";

/**
 * useNamedAccounts retrieves contract metadata from namedAccounts.json
 * @returns contract metadata from namedAccounts.json
 */
export const useNamedAccounts = <Chain extends DeploymentChainIds>(
  chainId: Chain | undefined,
  contractAddresses?: DeploymentContractsKeys<Chain>[] | undefined[],
) => {
  return useMemo(() => (chainId && getNamedAccounts(chainId, contractAddresses)) || [], [chainId, contractAddresses]);
};
export default useNamedAccounts;
