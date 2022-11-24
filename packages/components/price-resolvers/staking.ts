import { ChainId, getNamedAccounts } from "@popcorn/utils";
import { Contract } from "ethers";
import defi_llama from "./llama";

export const staking = async (address: string, chainId: ChainId, rpc, resolvers) => {
  const staking = new Contract(address, ["function stakingToken() external view returns (address)"], rpc);

  const stakingToken = await staking.stakingToken();

  const [token] = getNamedAccounts(chainId.toString() as any, [stakingToken as any]);

  if (token?.priceResolver && typeof resolvers[token.priceResolver] === "function") {
    return resolvers[token.priceResolver](token.address, chainId, rpc, resolvers);
  }
  return defi_llama(token.address, chainId);
};
