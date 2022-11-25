import { ChainId, formatAndRoundBigNumber } from "@popcorn/utils";
import { usePrice } from "../hooks/usePrice";
import { useEffect } from "react";
import { UpdateTokenActionProps } from "../reducers/portfolio";

interface PriceProps {
  token: string;
  chainId: ChainId;
  resolver?: string;
  updateToken: (args: UpdateTokenActionProps) => void;
}

export const Price: React.FC<PriceProps> = ({ token, chainId, resolver, updateToken }) => {
  const { data: price, isValidating: priceValidating, error: priceError } = usePrice(token, chainId, resolver);

  useEffect(() => {
    if (priceError) console.log({ priceError, token, resolver, chainId });
  }, [priceError]);

  useEffect(() => {
    updateToken({ token, chainId, price, isLoading: priceValidating, error: priceError });
  }, [price, priceValidating, priceError]);

  return <>Price: {(price && !priceError && `$${formatAndRoundBigNumber(price.value, price.decimals)}`) ?? "Loading ... "}</>;
};

export default Price;
