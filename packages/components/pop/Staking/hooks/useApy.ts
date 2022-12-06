import { useProvider } from "wagmi";
import useSWR from "swr";
import { resolve_apy } from "../../utils/resolvers/apy-resolvers/resolve_apy";
import { useMemo } from "react";
import { popHookAdapter } from "../../utils/hooks/swrPopHookAdapter";
import { BigNumberWithFormatted, Pop } from "../../types";
import { useNamedAccounts } from "../../utils";

interface UseApyProps extends Pop.StdProps {
  resolver?: string;
}

export const useApy: Pop.Hook<BigNumberWithFormatted> = ({ resolver, address, chainId }: UseApyProps) => {
  const provider = useProvider({ chainId: Number(chainId) });
  const [metadata] = useNamedAccounts(chainId.toString() as any, (!!address && [address]) || []);
  const _resolver = useMemo(() => resolver || metadata?.apyResolver, [resolver, metadata]);

  return popHookAdapter(
    useSWR(!!address && !!chainId && !!_resolver ? [`useApy:${chainId}:${address}:${resolver}`] : null, async () => {
      return !!address && resolve_apy({ address, chainId, rpc: provider, resolver: _resolver });
    }),
  ) as Pop.HookResult<BigNumberWithFormatted>;
};
