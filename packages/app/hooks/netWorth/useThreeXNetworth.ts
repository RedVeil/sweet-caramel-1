
import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { ChainId, PRC_PROVIDERS } from "@popcorn/utils";
import { constants, BigNumber } from "ethers/lib/ethers";
import { useMemo } from "react";
import useStakingPool from "hooks/staking/useStakingPool";
import useWeb3 from "hooks/useWeb3";
import getHoldingValue from "helper/getHoldingValue";
import useThreeXData from "hooks/set/useThreeXData";

export default function useThreeXNetworth(): { [key: string]: BigNumber } {
  const { contractAddresses } = useWeb3();
  const { threeXStaking } = useMemo(
    () => getChainRelevantContracts(ChainId.Ethereum),
    [],
  );
  const { data: threeXStakingPool } = useStakingPool(threeXStaking);
  const { data: threeXBatchData } = useThreeXData(PRC_PROVIDERS[ChainId.Ethereum]);

  const threeXHoldings = useMemo(() => {
    if (!threeXBatchData) return constants.Zero;
    const threeX = threeXBatchData?.tokens.find((token) => token.address === contractAddresses.threeX);
    return getHoldingValue(threeX?.balance?.add(threeX?.claimableBalance), threeX?.price);
  }, [threeXBatchData]);

  const threeXStakingHoldings = useMemo(() => {
    if (!threeXStakingPool || !threeXBatchData) return constants.Zero;
    const threeX = threeXBatchData?.tokens.find((token) => token.address === contractAddresses.threeX);
    return getHoldingValue(threeXStakingPool.userStake, threeX?.price);
  }, [threeXStakingPool, threeXBatchData]);

  const threeXRedeemBatchHoldings = useMemo(() => {
    if (!threeXBatchData) return constants.Zero;
    const usdc = threeXBatchData?.tokens.find((token) => token.address === contractAddresses.usdc);
    return getHoldingValue(usdc?.claimableBalance, usdc?.price);
  }, [threeXBatchData]);

  return {
    threeXHoldings,
    threeXStakingHoldings,
    threeXRedeemBatchHoldings,
  }
}