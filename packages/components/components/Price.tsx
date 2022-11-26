import { ChainId, formatAndRoundBigNumber } from "@popcorn/utils";
import { usePrice } from "../hooks/usePrice";
import { useEffect, useMemo } from "react";
import { PortfolioState, PortfolioToken } from "../reducers/portfolio";
import useUpdateToken from "../hooks/portfolio/useUpdateToken";
import useLog from "../hooks/utils/useLog";

interface PriceProps {
  address: string;
  chainId: ChainId;
  state?: PortfolioState;
  resolver?: string;
  updateToken?: (args: PortfolioToken) => void;
}

export const Price: React.FC<PriceProps> = ({ address, chainId, resolver, state, updateToken }) => {
  const token = useMemo(() => state?.tokens?.[chainId]?.[address], [state, chainId, address]);

  const { data, isValidating, error } = usePrice(address, chainId, token?.priceResolver || resolver);

  const update = useUpdateToken({ chainId, address, token, updateToken });

  useLog({ data, isValidating, error });

  useEffect(() => {
    if (data || error)
      update(["price", { ... { data, isValidating, error } }]);
  }, [data, error]);

  return <>Price: {(data && `$${formatAndRoundBigNumber(data.value, data.decimals)}`) ?? "Loading ... "}</>;
};

export default Price;
