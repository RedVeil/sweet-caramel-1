import { ChainId, formatAndRoundBigNumber } from "@popcorn/utils";
import { useProvider } from "wagmi";
import { PortfolioToken } from "../reducers/portfolio";
import useSWR, { SWRResponse } from "swr";
import Resolvers from "../resolvers/apy-resolvers";
import { BigNumber } from "ethers";

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
  const provider = useProvider({ chainId });

  return useSWR(!!address && !!chainId && !!resolver ? [address, chainId, resolver] : null, async () => {
    let apy;

    console.log({ resolver, address, chainId });
    if (resolver && typeof Resolvers[resolver] === "function") {
      apy = await Resolvers[resolver](address, chainId, provider);
    }

    return { ...apy, formatted: formatAndRoundBigNumber(apy.value, apy.decimals) + "%" };
  });
};
