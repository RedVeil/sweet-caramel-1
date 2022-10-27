import { ChainId } from "@popcorn/utils";
import { BigNumber, constants } from "ethers/lib/ethers";
import useButterBatchData from "hooks/set/useButterBatchData";
import useStakingPool from "hooks/staking/useStakingPool";
import { useDeployment } from "hooks/useDeployment";
import { useMemo } from "react";
import useCommonNetworthFunctions from "./useCommonNetworthFunctions";

export default function useButterNetworth(): {
  butterHoldings: BigNumber;
  butterStakingHoldings: BigNumber;
  butterRedeemBatchHoldings: BigNumber;
} {
  const { Ethereum } = ChainId;
  const ethereum = useDeployment(Ethereum);
  console.log("🚀 ~ file: useButterNetworth.ts ~ line 16 ~ useButterNetworth ~ ethereum", ethereum);
  const { data: butterStakingPool } = useStakingPool(ethereum.butterStaking, Ethereum);
  const { data: butterBatchData } = useButterBatchData(Ethereum);
  const { getHoldingValue } = useCommonNetworthFunctions(ethereum, Ethereum);

  const butterHoldings = useMemo(() => {
    if (!butterBatchData) return constants.Zero;
    const butter = butterBatchData?.tokens.find((token) => token.address === ethereum.butter);
    return getHoldingValue(butter?.balance?.add(butter?.claimableBalance), butter?.price);
  }, [butterBatchData]);

  const butterStakingHoldings = useMemo(() => {
    if (!butterStakingPool || !butterBatchData) return constants.Zero;
    const butter = butterBatchData?.tokens.find((token) => token.address === ethereum.butter);
    return getHoldingValue(butterStakingPool?.userStake, butter?.price);
  }, [butterStakingPool, butterBatchData]);

  console.log("ljhljkgkdgd", butterHoldings);

  const butterRedeemBatchHoldings = useMemo(() => {
    if (!butterBatchData) return constants.Zero;
    const threeCrv = butterBatchData?.tokens.find((token) => token.address === ethereum.threeCrv);
    return getHoldingValue(threeCrv?.claimableBalance, threeCrv?.price);
  }, [butterBatchData]);

  return {
    butterHoldings,
    butterStakingHoldings,
    butterRedeemBatchHoldings,
  };
}
