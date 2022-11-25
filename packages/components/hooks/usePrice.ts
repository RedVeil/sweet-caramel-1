import { Resolvers } from "../resolvers/price-resolvers";
import useSWR from "swr";
import { useProvider } from "wagmi";
import { SWRResponse } from "swr";
import { BigNumber } from "ethers";

export const usePrice = (
  address: string,
  chainId: number,
  resolver?: string,
): SWRResponse<{ value: BigNumber; decimals: number }> => {
  const provider = useProvider({ chainId });

  return useSWR(!!address && !!chainId ? [address, chainId, resolver] : null, async () => {
    let price;
    if (resolver && typeof Resolvers[resolver] === "function") {
      console.log("using resolver", resolver);
      price = await Resolvers[resolver](address, chainId, provider);
    } else {
      price = await Resolvers["defi_llama"](address, chainId);
    }
    return price;
  });
};
