import { ChainId } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import { useDeployment } from "hooks/useDeployment";
import useCommonNetworthFunctions from "./useCommonNetworthFunctions";

export default function usePolygonNetworth(): {
  total: BigNumber;
  inWallet: BigNumber;
  deposit: BigNumber;
  vesting: BigNumber;
} {
  const { Polygon } = ChainId;
  const polygon = useDeployment(Polygon);

  const { escrowHoldings, popHoldings, popStakingHoldings } = useCommonNetworthFunctions(polygon, Polygon);

  const calculatePolygonHoldings = (): BigNumber => {
    return [popHoldings, popStakingHoldings, escrowHoldings].reduce((total, num) => total.add(num));
  };

  return {
    total: calculatePolygonHoldings(),
    inWallet: popHoldings,
    deposit: popStakingHoldings,
    vesting: escrowHoldings,
  };
}
