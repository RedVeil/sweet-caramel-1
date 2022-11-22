import deployments from "@popcorn/hardhat/lib/utils/exporter/out/deployments.json";

export type Deployments = typeof deployments;

export type DeploymentContractsKeys<ChainId extends keyof Deployments> = keyof Deployments[ChainId]["contracts"];

export type DeploymentChainIds = keyof Deployments;

export type ContractAddresses<ChainId extends keyof Deployments> = {
  [key in DeploymentContractsKeys<ChainId>]: Deployments[ChainId]["contracts"][keyof Deployments[ChainId]["contracts"]];
} & { all: Set<string>; has: (contractAddress: string) => boolean };

export const getNamedAccounts = <Chain extends DeploymentChainIds>(
  chainId: any,
  contractAddresses: Array<DeploymentContractsKeys<Chain>>,
) =>
  contractAddresses.map((contract) => ({
    ...(deployments[chainId].contracts[contract as string]?.metadata ||
      deployments[chainId].contracts[(contract as string)?.toLowerCase()]?.metadata),
    ...(deployments[chainId].contracts[contract as string] ||
      deployments[chainId].contracts[(contract as string)?.toLowerCase()]),
    __alias: contract,
    chainId: chainId,
  }));
