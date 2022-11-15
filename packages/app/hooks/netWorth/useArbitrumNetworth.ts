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

  const {
    useHoldingValue,
    popPrice,
    chainPopBalance: arbitrumPopBalance,
    chainEscrow: arbitrumEscrow
  } = useCommonNetworthFunctions(arbitrum, Arbitrum);


  // pop holdings
  const arbitrumPopHoldings = useHoldingValue(arbitrumPopBalance, popPrice);

  // escrow holdings
  const arbitrumEscrowHoldings = useHoldingValue(
    arbitrumEscrow?.totalClaimablePop?.add(arbitrumEscrow?.totalVestingPop),
    popPrice,
  );

  // total holdings
  const calculateArbitrumHoldings = (): BigNumber => {
    return [arbitrumPopHoldings, arbitrumEscrowHoldings].reduce((total, num) => total.add(num));
  };

  return {
    total: calculateArbitrumHoldings(),
    inWallet: arbitrumPopHoldings,
    deposit: BigNumber.from("0"),
    vesting: arbitrumEscrowHoldings,
  };
}
