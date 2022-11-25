import { BigNumber } from "ethers";
import { formatAndRoundBigNumber } from "@popcorn/utils";
import { ContractTvl } from "./ContractTvl";
import withLoading from "./withLoading";

type Contracts = { chainId: number; priceResolver?: string; address: string }[];

export const GroupedTvl = ({
  contracts,
  add,
  tvl,
}: {
  contracts: Contracts;
  tvl: BigNumber;
  add: (amount) => void;
}) => {
  return (
    <>
      <div>TVL: {formatAndRoundBigNumber(tvl, 18)}</div>
      {contracts.map(({ address, chainId, priceResolver }) => (
        <ContractTvl
          key={chainId + address}
          address={address}
          chainId={chainId}
          priceResolver={priceResolver}
          add={add}
        />
      ))}
    </>
  );
};

export const GroupedTvlWithLoading = withLoading(GroupedTvl);
