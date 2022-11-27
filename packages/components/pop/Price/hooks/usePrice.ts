import useSWR from "swr";
import { useProvider } from "wagmi";
import { BigNumber } from "ethers";
import { resolve_price } from "../../../resolvers/price-resolvers/resolve_price";
import { Pop } from "../../types";
import { popHookAdapter } from "../../utils/hooks/swrPopHookAdapter";

interface Props {
  resolver?: string;
}
export const usePrice: Pop.Hook<{ value: BigNumber; decimals: number }, Props> = ({ address, chainId, resolver }) => {
  const provider = useProvider({ chainId: Number(chainId) });

  return popHookAdapter(
    useSWR(!!address && !!chainId ? [`usePrice:${chainId}:${address}:${resolver}`] : null, async () =>
      resolve_price({ address, chainId, rpc: provider, resolver }),
    ),
  );
};
export default usePrice;
