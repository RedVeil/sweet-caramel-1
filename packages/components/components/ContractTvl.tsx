import { BigNumber } from "ethers";
import { useEffect, useState } from "react";
import useTvl from "../hooks/useTvl";
import { PortfolioToken } from "../reducers/portfolio";
import { MinimalContractMetadata } from "../types";
import withLoading from "./withLoading";

export const ContractTvl = ({
  address,
  chainId,
  priceResolver,
  add,
  updateToken,
}: MinimalContractMetadata & { add?: (amount) => void } & { updateToken?: (token: PortfolioToken) => void } & { token?: PortfolioToken }) => {
  const { data, error, isValidating } = useTvl({ address, chainId, priceResolver });

  useEffect(() => {
    if (error) console.log({ data, error });
  }, [error]);

  const [tvl, setTvl] = useState<BigNumber>();

  useEffect(() => {
    if (data?.value && !tvl) {
      setTvl(data.value);
      add?.(data.value);
      updateToken?.({ tvl: { data }, address, chainId });
    }
  }, [data, error, isValidating]);

  return (
    <>
      <div>Market Cap: {data?.formatted}</div>
    </>
  );
};

export const ContractTvlWithLoading = withLoading(ContractTvl);
export const Tvl = withLoading(ContractTvl);
