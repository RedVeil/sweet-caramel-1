import { ChainId } from "@popcorn/utils";
import { useProvider } from "wagmi";
import useSWR from "swr";
import useNamedAccounts from "../../../hooks/useNamedAccounts";
import { resolve_apy } from "../../utils/resolvers/apy-resolvers/resolve_apy";
import { useMemo } from "react";
import { popHookAdapter } from "../../utils/hooks/swrPopHookAdapter";
import { BigNumberWithFormatted, Pop } from "../../types";

interface UseApyProps {
  resolver?: string;
  address: string;
  chainId: ChainId;
}

export const useApy: Pop.Hook<BigNumberWithFormatted, { resolver?: string }> = ({ resolver, address, chainId }) => {
  const provider = useProvider({ chainId: Number(chainId) });
  const [metadata] = useNamedAccounts(chainId.toString() as any, [address]);
  const _resolver = useMemo(() => resolver || metadata?.apyResolver, [resolver, metadata]);

  return popHookAdapter(
    useSWR(!!address && !!chainId && !!_resolver ? [`useApy:${chainId}:${address}:${resolver}`] : null, async () => {
      console.log({ _resolver, address, chainId, rpc: provider });
      return resolve_apy({ address, chainId, rpc: provider, resolver: _resolver });
    }),
  );
};
