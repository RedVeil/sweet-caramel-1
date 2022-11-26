import { ChainId } from "packages/utils";
import { useEffect, useMemo } from "react";
import useUpdateToken from "../hooks/portfolio/useUpdateToken";
import { useApy } from "../hooks/useApy";
import useLog from "../hooks/utils/useLog";
import { PortfolioState, PortfolioToken } from "../reducers/portfolio";

interface ApyProps {
  address: string;
  chainId: ChainId;
  resolver?: string;
  state?: PortfolioState;
  updateToken?: (args: PortfolioToken) => void;
}
export const Apy: React.FC<ApyProps> = ({ address, chainId, resolver, state, updateToken }) => {
  const { data, isValidating, error: apyError } = useApy({ address, chainId, resolver });

  const loading = !data?.value && isValidating;

  useLog({ apyError }, [apyError]);

  const token = useMemo(() => state?.tokens?.[chainId]?.[address], [state?.tokens?.[chainId]?.[address], chainId, address]);

  const update = useUpdateToken({ chainId, address, token, updateToken });

  useEffect(() => {
    if (data || apyError)
      update(["apy", { data, isLoading: loading, error: apyError }]);
  }, [data, apyError, loading]);

  return (
    <>
      {loading && "Loading ..."}
      {data?.value && <div>APY: {data?.formatted} </div>}
    </>
  );
};
