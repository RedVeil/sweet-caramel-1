import { ChainId } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import { useDeployment } from "hooks/useDeployment";
import useCommonNetworthFunctions from "./useCommonNetworthFunctions";

export default function useArbitrumNetworth(): {
  total: BigNumber;
  inWallet: BigNumber;
  deposit: BigNumber;
  vesting: BigNumber;
} {
  const { Arbitrum } = ChainId;
  const arbitrum = useDeployment(Arbitrum);
  const { escrowHoldings, popHoldings } = useCommonNetworthFunctions(arbitrum, Arbitrum);

  const calculateArbitrumHoldings = (): BigNumber => {
    return [popHoldings, escrowHoldings].reduce((total, num) => total.add(num));
  };

  return {
    total: calculateArbitrumHoldings(),
    inWallet: popHoldings,
    deposit: BigNumber.from("0"),
    vesting: escrowHoldings,
  };
}
