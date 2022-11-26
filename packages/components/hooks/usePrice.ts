import useSWR from "swr";
import { useProvider } from "wagmi";
import { SWRResponse } from "swr";
import { BigNumber } from "ethers";
import { resolve_price } from "../resolvers/price-resolvers/resolve_price";

export const usePrice = (
  address: string,
  chainId: number,
  resolver?: string,
): SWRResponse<{ value: BigNumber; decimals: number }> => {
  const provider = useProvider({ chainId: Number(chainId) });

  return useSWR(!!address && !!chainId ? [address, chainId, resolver] : null, async () =>
    resolve_price({ address, chainId, rpc: provider, resolver }),
  );
};
