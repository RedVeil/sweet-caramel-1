import { ChainId } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import useCommonNetworthFunctions from "./useCommonNetworthFunctions";

export default function useBnbNetworth(): {
  total: BigNumber;
  inWallet: BigNumber;
  deposit: BigNumber;
  vesting: BigNumber;
} {
  const { BNB } = ChainId;
  const bnb = useDeployment(BNB);

  const {
    useHoldingValue,
    popPrice,
    chainPopBalance: bnbPopBalance,
    chainEscrow: bnbEscrow,
  } = useCommonNetworthFunctions(bnb, BNB);

  // escrow holdings
  const bnbEscrowHoldings = useHoldingValue(bnbEscrow?.totalClaimablePop?.add(bnbEscrow?.totalVestingPop), popPrice);

  // pop holdings
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
