import { ChainId } from "@popcorn/utils";
import { useRouter } from "next/router";
import { useMemo } from "react";
import useWeb3 from "@popcorn/app/hooks/useWeb3";

export default function useNetworkName() {
  const router = useRouter();
  const { connectedChainId } = useWeb3();
  return useMemo(
    () => ((router?.query?.network as string) || ChainId[connectedChainId] || ChainId[ChainId.Ethereum])?.toLowerCase(),
    [router?.query?.network, connectedChainId],
  );
}
