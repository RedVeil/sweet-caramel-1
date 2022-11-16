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

export default function useStakingData(stakingPool: StakingPool, ChainId: ChainId) {
  // : useStakingDataValues {
  const address = stakingPool?.stakingToken?.address?.toLowerCase();
  const { data: tokenPrices, isValidating, error } = useTokenPrices([address], ChainId);

  const tokenPrice =
    !isValidating && !error
      ? tokenPrices?.[address]
        ? tokenPrices[address]
        : numberToBigNumber(0, 18)
      : numberToBigNumber(0, 18);

  const metadata = useContractMetadata(stakingPool?.stakingToken?.address, ChainId);

  console.log(tokenPrice);

  // calculate tvl
  let tvl =
    tokenPrice && stakingPool?.totalStake
      ? stakingPool?.totalStake?.mul(tokenPrice).div(constants.WeiPerEther)
      : numberToBigNumber(0, 18);
  // let tvl = numberToBigNumber(0, 18);

  // calculate vAPR
  const vAPR = !stakingPool?.apy || stakingPool?.apy?.lt(constants.Zero) ? numberToBigNumber(0, 18) : stakingPool?.apy;

  // get Emissions
  const emissions = stakingPool ? stakingPool.tokenEmission : numberToBigNumber(0, 18);

  const deposited =
    tokenPrice && stakingPool?.userStake ? stakingPool?.userStake?.mul(tokenPrice) : numberToBigNumber(0, 18);
  // console.log(deposited);

  // // const deposited = numberToBigNumber(0, 18);
  // console.log('id:', ChainId);

  const tokenIcon = {
    address: stakingPool ? stakingPool?.tokenAddress : address,
    chainId: ChainId,
  };
  const tokenName = metadata?.name ? metadata.name : stakingPool?.stakingToken?.name;

  const earned = tokenPrice && stakingPool?.earned ? stakingPool?.earned.mul(tokenPrice) : numberToBigNumber(0, 18);
  // // const earned = numberToBigNumber(0, 18);

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
