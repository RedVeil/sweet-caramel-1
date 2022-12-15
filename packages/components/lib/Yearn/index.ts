import { Yearn } from "@yfi/sdk";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";

export const apy = async ({ address, chainId, rpc }): Promise<{ value: BigNumber; decimals: number }> => {
  const yearn = new Yearn(Number(chainId) as 1 | 250 | 1337 | 42161, {
    provider: rpc,
    subgraph: {
      mainnetSubgraphEndpoint: "https://api.thegraph.com/subgraphs/name/rareweasel/yearn-vaults-v2-subgraph-mainnet",
    },
  });
  const [vault] = await yearn.vaults.get([address]);
  console.log({ yearn: vault, address, chainId });
  return { value: parseEther(`${vault.metadata.apy?.net_apy || "0"}`), decimals: 18 };
};
