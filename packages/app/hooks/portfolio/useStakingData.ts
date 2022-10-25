import { formatAndRoundBigNumber } from "@popcorn/utils";
import { BigNumber, constants } from "ethers";
import useContractMetadata from "hooks/useContractMetadata";
import useTokenPrice from "hooks/useTokenPrice";
import useWeb3 from "hooks/useWeb3";

export default function useStakingData(stakingPool) {
  const { connectedChainId } = useWeb3();
  const tokenPrice = useTokenPrice(stakingPool?.stakingToken.address, connectedChainId);
  const metadata = useContractMetadata(stakingPool.stakedToken?.address, connectedChainId);

  // calculate tvl
  let tvl = tokenPrice ? stakingPool?.totalStake?.mul(tokenPrice).div(constants.WeiPerEther) : "0";

  // calculate vAPR
  const vAPR = stakingPool ? (stakingPool?.apy.lt(constants.Zero) ? "New 🍿✨" : stakingPool.apy) : "0";

  // get Emissions
  const emissions = stakingPool ? stakingPool.tokenEmission : "0";

  const deposited = tokenPrice ? stakingPool?.userStake?.mul(tokenPrice) : "0";

  let stakingData = {
    tvl,
    vAPR,
    emissions,
    deposited,
    formatDecimal: stakingPool?.stakingToken.decimals,
  };

  let productProps = {
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
    productProps = {
      tokenName: `${metadata?.name ? metadata.name : stakingPool.stakedToken.name}`,
      tokenStatusLabels: [
        {
          content: `$${
            BigNumber.isBigNumber(deposited) ? formatAndRoundBigNumber(deposited, stakingData.formatDecimal) : deposited
          }`,
          label: "Deposited",
          infoIconProps: {
            id: "products-deposited",
            title: "How we calculate the Deposited",
            content: "How we calculate the Deposited is lorem ipsum",
          },
        },
        {
          content: `${BigNumber.isBigNumber(vAPR) ? formatAndRoundBigNumber(vAPR, stakingData.formatDecimal) : vAPR}%`,
          label: "vAPR",
          emissions: `${
            BigNumber.isBigNumber(emissions) ? formatAndRoundBigNumber(emissions, stakingData.formatDecimal) : emissions
          } POP`,
          infoIconProps: {
            id: "products-vapr",
            title: "How we calculate the vAPR",
            content: "How we calculate the Deposited is lorem ipsum",
          },
        },
        {
          content: `$${BigNumber.isBigNumber(tvl) ? formatAndRoundBigNumber(tvl, stakingData.formatDecimal) : tvl}`,
          label: "TVL",
          infoIconProps: {
            id: "products-tvl",
            title: "How we calculate the TVL",
            content: "How we calculate the Deposited is lorem ipsum",
          },
        },
      ],
    };
  }
  return {
    productProps,
    deposited: BigNumber.isBigNumber(deposited)
      ? formatAndRoundBigNumber(deposited, stakingData.formatDecimal)
      : deposited,
  };
}
