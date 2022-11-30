import deployments from "@popcorn/hardhat/lib/utils/exporter/out/deployments.json";

export type Deployments = typeof deployments;

export type DeploymentContractsKeys<ChainId extends keyof Deployments> = keyof Deployments[ChainId]["contracts"];

export type DeploymentChainIds = keyof Deployments;

export type ContractAddresses<ChainId extends keyof Deployments> = {
  [key in DeploymentContractsKeys<ChainId>]: Deployments[ChainId]["contracts"][keyof Deployments[ChainId]["contracts"]];
} & { all: Set<string>; has: (contractAddress: string) => boolean };

/**
 * getNamedAccounts is a utility function that returns an array of contracts with metadata defined in namedAccounts.json
 * @param chainId chainId as string
 * @param contractAddresses string[] - optional - if not provided, all contracts for the given chainId will be returned. otherwise an array of contract aliases or contract addresses may be provided to get the contract metadata for those contracts
 * @returns
 */
export const getNamedAccounts = <Chain extends DeploymentChainIds>(
  chainId: Chain,
  contractAddresses?: Array<DeploymentContractsKeys<Chain>> | undefined[],
) => {
  return !contractAddresses
    ? Object.keys(deployments[chainId].contracts).map((contract) => map(chainId, contract))
    : contractAddresses.map((contract) => map(chainId, contract));
};

const map = (chainId, contract) => ({
  ...(deployments[chainId].contracts[contract as string]?.metadata ||
    deployments[chainId].contracts[(contract as string)?.toLowerCase()]?.metadata),
  ...(deployments[chainId].contracts[contract as string] ||
    deployments[chainId].contracts[(contract as string)?.toLowerCase()]),
  __alias: contract,
  chainId: chainId,
});
