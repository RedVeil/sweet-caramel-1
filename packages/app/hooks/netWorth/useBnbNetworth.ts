import { ChainId } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import { useDeployment } from "hooks/useDeployment";
import useCommonNetworthFunctions from "./useCommonNetworthFunctions";

export default function useBnbNetworth(): {
  total: BigNumber;
  inWallet: BigNumber;
  deposit: BigNumber;
  vesting: BigNumber;
} {
  const { BNB } = ChainId;
  const bnb = useDeployment(BNB);

  const { escrowHoldings, popHoldings } = useCommonNetworthFunctions(bnb, BNB);

  const calculateBnbHoldings = (): BigNumber => {
    return [popHoldings, escrowHoldings].reduce((total, num) => total.add(num));
  };

  return {
    total: calculateBnbHoldings(),
    inWallet: popHoldings,
    deposit: BigNumber.from("0"),
    vesting: escrowHoldings,
  };
}
