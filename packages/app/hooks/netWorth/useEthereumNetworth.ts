import { ChainId } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import { useDeployment } from "hooks/useDeployment";
import useButterNetworth from "./useButterNetworth";
import useCommonNetworthFunctions from "./useCommonNetworthFunctions";
import useThreeXNetworth from "./useThreeXNetworth";

export default function useEthereumNetworth(): {
  total: BigNumber;
  inWallet: BigNumber;
  deposit: BigNumber;
  vesting: BigNumber;
} {
  const { Ethereum } = ChainId;
  const ethereum = useDeployment(Ethereum);

  const { escrowHoldings, popHoldings, popStakingHoldings } = useCommonNetworthFunctions(ethereum, Ethereum);
  const { threeXHoldings, threeXStakingHoldings, threeXRedeemBatchHoldings } = useThreeXNetworth();
  const { butterHoldings, butterStakingHoldings, butterRedeemBatchHoldings } = useButterNetworth();

  const calculateEthereumHoldings = (): BigNumber => {
    return [
      popHoldings,
      popStakingHoldings,
      butterHoldings,
      threeXHoldings,
      butterStakingHoldings,
      threeXStakingHoldings,
      escrowHoldings,
      butterRedeemBatchHoldings,
      threeXRedeemBatchHoldings,
    ].reduce((total, num) => total.add(num));
  };

  const totalDeposits = () => {
    return [
      threeXHoldings,
      threeXStakingHoldings,
      threeXRedeemBatchHoldings,
      butterStakingHoldings,
      butterHoldings,
      butterRedeemBatchHoldings,
      popStakingHoldings,
    ].reduce((total, num) => total.add(num));
  };

  return {
    total: calculateEthereumHoldings(),
    inWallet: popHoldings,
    deposit: totalDeposits(),
    vesting: escrowHoldings,
  };
}
