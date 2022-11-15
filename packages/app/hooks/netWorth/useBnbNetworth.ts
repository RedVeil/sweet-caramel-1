import { ChainId } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import { useDeployment } from "hooks/useDeployment";
import useCommonNetworthFunctions from "./useCommonNetworthFunctions";
import useGetUserEscrows from "hooks/useGetUserEscrows";

export default function useBnbNetworth(): {
  total: BigNumber;
  inWallet: BigNumber;
  deposit: BigNumber;
  vesting: BigNumber;
} {
  const { BNB } = ChainId;
  const bnb = useDeployment(BNB);

  const { useHoldingValue, popPrice, account, chainPopBalance: bnbPopBalance } = useCommonNetworthFunctions(bnb, BNB);
  const { data: bnbEscrow } = useGetUserEscrows(bnb.rewardsEscrow, account, BNB);
  const bnbEscrowHoldings = useHoldingValue(bnbEscrow?.totalClaimablePop?.add(bnbEscrow?.totalVestingPop), popPrice);
  const bnbPopHoldings = useHoldingValue(bnbPopBalance, popPrice);


  const calculateBnbHoldings = (): BigNumber => {
    return [bnbPopHoldings, bnbEscrowHoldings].reduce((total, num) => total.add(num));
  };

  return {
    total: calculateBnbHoldings(),
    inWallet: bnbPopHoldings,
    deposit: BigNumber.from("0"),
    vesting: bnbEscrowHoldings,
  };
}
