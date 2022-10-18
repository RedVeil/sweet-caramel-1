import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { ChainId, PRC_PROVIDERS } from "@popcorn/utils";
import { constants, BigNumber } from "ethers/lib/ethers";
import { useMemo } from "react";
import useButterBatchData from "hooks/set/useButterBatchData";
import useStakingPool from "hooks/staking/useStakingPool";
import useWeb3 from "hooks/useWeb3";
import getHoldingValue from "helper/getHoldingValue";

export default function useButterNetworth(): { [key: string]: BigNumber } {
  const { contractAddresses } = useWeb3();
  const { butterStaking } = useMemo(
    () => getChainRelevantContracts(ChainId.Ethereum),
    [],
  );
  const { data: butterStakingPool } = useStakingPool(butterStaking);
  const { data: butterBatchData } = useButterBatchData(PRC_PROVIDERS[ChainId.Ethereum]);

  const butterHoldings = useMemo(() => {
    if (!butterBatchData) return constants.Zero;
    const butter = butterBatchData?.tokens.find((token) => token.address === contractAddresses.butter);
    return getHoldingValue(butter?.balance?.add(butter?.claimableBalance), butter?.price);
  }, [butterBatchData]);

  const butterStakingHoldings = useMemo(() => {
    if (!butterStakingPool || !butterBatchData) return constants.Zero;
    const butter = butterBatchData?.tokens.find((token) => token.address === contractAddresses.butter);
    return getHoldingValue(butterStakingPool.userStake, butter?.price);
  }, [butterStakingPool, butterBatchData]);

  const butterRedeemBatchHoldings = useMemo(() => {
    if (!butterBatchData) return constants.Zero;
    const threeCrv = butterBatchData?.tokens.find((token) => token.address === contractAddresses.threeCrv);
    return getHoldingValue(threeCrv?.claimableBalance, threeCrv?.price);
  }, [butterBatchData]);

  return {
    butterHoldings,
    butterStakingHoldings,
    butterRedeemBatchHoldings,
  }
}