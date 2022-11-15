import { ChainId } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import { useDeployment } from "hooks/useDeployment";
import useCommonNetworthFunctions from "./useCommonNetworthFunctions";
import useGetUserEscrows from "hooks/useGetUserEscrows";

export default function useArbitrumNetworth(): {
  total: BigNumber;
  inWallet: BigNumber;
  deposit: BigNumber;
  vesting: BigNumber;
} {
  const { Arbitrum } = ChainId;
  const arbitrum = useDeployment(Arbitrum);
  const { useHoldingValue, account, popPrice, chainPopBalance: arbitrumPopBalance } = useCommonNetworthFunctions(arbitrum, Arbitrum);


  const { data: arbitrumEscrow } = useGetUserEscrows(arbitrum.rewardsEscrow, account, Arbitrum);

  const arbitrumPopHoldings = useHoldingValue(arbitrumPopBalance, popPrice);

  const arbitrumEscrowHoldings = useHoldingValue(
    arbitrumEscrow?.totalClaimablePop?.add(arbitrumEscrow?.totalVestingPop),
    popPrice,
  );

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
