import { ChainId, numberToBigNumber } from "@popcorn/utils";
import { StakingPool } from "@popcorn/utils/types";
import { BigNumber, constants } from "ethers";
import useContractMetadata from "hooks/useContractMetadata";
import useTokenPrices from "hooks/tokens/useTokenPrices";

export interface useStakingDataValues {
  tokenName?: string;
  tokenIcon?: {
    address: string;
    chainId: ChainId;
  };
  deposited: BigNumber;
  vAPR: BigNumber;
  tvl: BigNumber;
  emissions?: BigNumber;
  earned?: BigNumber;
}

export default function useStakingData(stakingPool: StakingPool, ChainId: ChainId): useStakingDataValues {
  const tokenPrice = useTokenPrices([stakingPool?.stakingToken?.address], ChainId);
  const metadata = useContractMetadata(stakingPool?.stakingToken?.address, ChainId);

  // calculate tvl
  let tvl = tokenPrice
    ? stakingPool?.totalStake?.mul(tokenPrice[0]).div(constants.WeiPerEther)
    : numberToBigNumber(0, 18);

  // calculate vAPR
  const vAPR = !stakingPool?.apy || stakingPool?.apy?.lt(constants.Zero) ? numberToBigNumber(0, 18) : stakingPool?.apy;

  // get Emissions
  const emissions = stakingPool ? stakingPool.tokenEmission : numberToBigNumber(0, 18);

  const deposited = tokenPrice ? stakingPool?.userStake?.mul(tokenPrice[0]) : numberToBigNumber(0, 18);

  const tokenIcon = {
    address: stakingPool ? stakingPool.tokenAddress : "",
    chainId: ChainId,
  };
  const tokenName = metadata?.name ? metadata.name : stakingPool?.stakingToken?.name;

  const earned = tokenPrice ? stakingPool.earned.mul(tokenPrice[0]) : numberToBigNumber(0, 18);

  let props = {
    tokenName,
    tokenIcon,
    deposited,
    vAPR,
    tvl,
    emissions,
    earned,
  };
  return props;
}
