import { BigNumber } from "ethers";
import { getNamedAccounts } from "packages/utils";
import { Resolvers } from ".";

interface GetPriceProps {
  address: string;
  chainId: number;
  resolver?: string;
  rpc?: any;
}

/**
 * recursively resolve price of token
 */
export function resolve_price({
  address,
  chainId,
  rpc,
  resolver,
}: GetPriceProps): Promise<{ value: BigNumber; decimals: number }> {
  const [metadata] = getNamedAccounts(chainId.toString() as any, [address as any]);
  const _resolver = resolver || metadata?.priceResolver;
  if (!!_resolver && typeof Resolvers[_resolver] === "function") {
    return Resolvers[_resolver](address, chainId, rpc);
  }
  return Resolvers.defi_llama(address, chainId, rpc);
}
