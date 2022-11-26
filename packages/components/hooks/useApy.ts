import { ChainId } from "@popcorn/utils";
import { useProvider } from "wagmi";
import { PortfolioToken } from "../reducers/portfolio";
import useSWR, { SWRResponse } from "swr";
import { BigNumber } from "ethers";
import useNamedAccounts from "./useNamedAccounts";
import { resolve_apy } from "../resolvers/apy-resolvers/resolve_apy";
import { useMemo } from "react";

interface UseApyProps {
  resolver?: string;
  address: string;
  chainId: ChainId;
  updateToken?: (args: PortfolioToken) => void;
}

export const useApy = ({
  resolver,
  address,
  chainId,
}: UseApyProps): SWRResponse<{ formatted: string; value: BigNumber }> => {
  const provider = useProvider({ chainId: Number(chainId) });

  const [metadata] = useNamedAccounts(chainId.toString() as any, [address]);

  const _resolver = useMemo(() => resolver || metadata?.apyResolver, [resolver, metadata]);

  return useSWR(!!address && !!chainId && !!_resolver ? [address, chainId, resolver] : null, async () => {
    console.log({ _resolver, address, chainId, rpc: provider });
    return resolve_apy({ address, chainId, rpc: provider, resolver: _resolver });
  });
};
