import { ChainId, numberToBigNumber } from "@popcorn/utils";
import { StakingPool } from "@popcorn/utils/types";
import { BigNumber, constants } from "ethers";
import useContractMetadata from "hooks/useContractMetadata";
import useTokenPrice from "hooks/useTokenPrice";

interface useStakingDataValues {
  tokenName: string;
  tokenIcon: string;
  deposited: BigNumber;
  vAPR: BigNumber;
  tvl: BigNumber;
  emissions: BigNumber;
}

export default function useStakingData(stakingPool: StakingPool, ChainId: ChainId): useStakingDataValues {
  // console.log('pool', stakingPool);

  const tokenPrice = useTokenPrice(stakingPool?.stakingToken?.address, ChainId);
  const metadata = useContractMetadata(stakingPool?.stakingToken?.address, ChainId);

  // calculate tvl
  let tvl = tokenPrice ? stakingPool?.totalStake?.mul(tokenPrice).div(constants.WeiPerEther) : numberToBigNumber(0, 18);

  // calculate vAPR
  const vAPR = stakingPool?.apy || stakingPool?.apy?.lt(constants.Zero) ? numberToBigNumber(0, 18) : stakingPool?.apy;

  // get Emissions
  const emissions = stakingPool ? stakingPool.tokenEmission : numberToBigNumber(0, 18);

  const deposited = tokenPrice ? stakingPool?.userStake?.mul(tokenPrice) : numberToBigNumber(0, 18);

  // let stakingData = {
  // 	tvl,
  // 	vAPR,
  // 	emissions,
  // 	deposited,
  // 	formatDecimal: stakingPool?.stakingToken.decimals,
  // };

  let props = {
    tokenName: ``,
    tokenIcon: ``,
    deposited,
    vAPR,
    tvl,
    emissions,
  };

  let productProps = {
    tokenIcon: ``,
    tokenName: ``,
    tokenStatusLabels: [
      {
        content: "$10,000",
        label: "Deposited",
        infoIconProps: {
          id: "products-deposited",
          title: "How we calculate the Deposited",
          content: "How we calculate the Deposited is lorem ipsum",
        },
      },
      {
        content: ``,
        label: "vAPR",
        emissions: `0 POP`,
        infoIconProps: {
          id: "products-vapr",
          title: "How we calculate the vAPR",
          content: "How we calculate the Deposited is lorem ipsum",
        },
      },
      {
        content: `$0`,
        label: "TVL",
        infoIconProps: {
          id: "products-tvl",
          title: "How we calculate the TVL",
          content: "How we calculate the Deposited is lorem ipsum",
        },
      },
    ],
  };
  if (stakingPool) {
    // productProps = {
    // 	tokenIcon: stakingPool.stakingToken.name,
    // 	tokenName: `${metadata?.name ? metadata.name : stakingPool.stakingToken.name}`,
    // 	tokenStatusLabels: [
    // 		{
    // 			content: `$${BigNumber.isBigNumber(deposited) ? formatAndRoundBigNumber(deposited, stakingData.formatDecimal) : deposited
    // 				}`,
    // 			label: "Deposited",
    // 			infoIconProps: {
    // 				id: "products-deposited",
    // 				title: "How we calculate the Deposited",
    // 				content: "How we calculate the Deposited is lorem ipsum",
    // 			},
    // 		},
    // 		{
    // 			content: `${BigNumber.isBigNumber(vAPR) ? formatAndRoundBigNumber(vAPR, stakingData.formatDecimal) : vAPR}%`,
    // 			label: "vAPR",
    // 			emissions: `${BigNumber.isBigNumber(emissions) ? formatAndRoundBigNumber(emissions, stakingData.formatDecimal) : emissions
    // 				} POP`,
    // 			infoIconProps: {
    // 				id: "products-vapr",
    // 				title: "How we calculate the vAPR",
    // 				content: "How we calculate the Deposited is lorem ipsum",
    // 			},
    // 		},
    // 		{
    // 			content: `$${BigNumber.isBigNumber(tvl) ? formatAndRoundBigNumber(tvl, stakingData.formatDecimal) : tvl}`,
    // 			label: "TVL",
    // 			infoIconProps: {
    // 				id: "products-tvl",
    // 				title: "How we calculate the TVL",
    // 				content: "How we calculate the Deposited is lorem ipsum",
    // 			},
    // 		},
    // 	],
    // };

    props = {
      tokenName: `${metadata?.name ? metadata.name : stakingPool.stakingToken.name}`,
      tokenIcon: stakingPool.stakingToken.name,
      deposited,
      vAPR,
      tvl,
      emissions,
    };
  }
  // return {
  // 	productProps,
  // 	deposited: BigNumber.isBigNumber(deposited)
  // 		? formatAndRoundBigNumber(deposited, stakingData.formatDecimal)
  // 		: deposited,
  // };
  return props;
}
