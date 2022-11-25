import { ChainId, formatAndRoundBigNumber } from "@popcorn/utils";
import { usePrice } from "../hooks/usePrice";
import { useEffect } from "react";
import { PortfolioToken } from "../reducers/portfolio";

interface PriceProps {
  address: string;
  chainId: ChainId;
  resolver?: string;
  updateToken?: (args: PortfolioToken) => void;
}

export const Price: React.FC<PriceProps> = ({ address, chainId, resolver, updateToken }) => {
  const { data, isValidating, error } = usePrice(address, chainId, resolver);

  useEffect(() => {
    if (error) console.log({ priceError: error, address, resolver, chainId });
  }, [error]);

  useEffect(() => {
    updateToken?.({ address, chainId, price: { data, isValidating, error } });
  }, [data, isValidating, error]);

  return <>Price: {(data && !error && `$${formatAndRoundBigNumber(data.value, data.decimals)}`) ?? "Loading ... "}</>;
};

export default Price;
