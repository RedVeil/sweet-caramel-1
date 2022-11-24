import { BigNumber } from "ethers";
import { useEffect, useState } from "react";
import useTvl from "../hooks/useTvl";
import { MinimalContractMetadata } from "../types";

export const ContractTvl = ({
  address,
  chainId,
  priceResolver,
  add,
}: MinimalContractMetadata & { add?: (amount) => void }) => {
  const { data, error } = useTvl({ address, chainId, priceResolver });

  useEffect(() => {
    if (error) console.log({ data, error });
  }, [error]);

  const [tvl, setTvl] = useState<BigNumber>();

  useEffect(() => {
    if (data?.value && !tvl) {
      setTvl(data.value);
      add?.(data.value);
    }
  }, [data]);

  return (
    <>
      <h3>TVL</h3> <div>{data?.formatted}</div>
    </>
  );
};
