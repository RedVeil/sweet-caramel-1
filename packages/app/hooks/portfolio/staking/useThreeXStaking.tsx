import { ChainId, formatAndRoundBigNumber, networkLogos, networkMap, numberToBigNumber } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import useStakingPool from "hooks/staking/useStakingPool";
import { useDeployment } from "hooks/useDeployment";
import useStakingData from "./useStakingData";

export default function useThreeXStaking() {
  const { Ethereum } = ChainId;
  const { threeXStaking } = useDeployment(Ethereum);
  const { data: threeXPool } = useStakingPool(threeXStaking, Ethereum);

  const threeXStakingData = useStakingData(threeXPool, Ethereum);

  let threeXTotalBigNumberValues: { deposited: BigNumber; tvl: BigNumber; vAPR: BigNumber; earned?: BigNumber } = {
    deposited: numberToBigNumber(0, 18),
    tvl: numberToBigNumber(0, 18),
    vAPR: numberToBigNumber(0, 18),
    earned: numberToBigNumber(0, 18),
  };

  let threeXProps = {
    tokenIcon: {
      address: "",
      chainId: Ethereum,
    },
    tokenName: ``,
    tokenStatusLabels: [
      {
        image: (
          <img src={networkLogos[Ethereum]} alt={`${networkMap[Ethereum]}-logo`} className="h-5 w-5 object-contain" />
        ),
        label: "Network",
        infoIconProps: {
          id: "arrakis-network",
          title: "How we calculate the Deposited",
          content: "Your current selected Network",
        },
      },
      {
        content: "$0",
        label: "Deposited",
        infoIconProps: {
          id: "products-deposited",
          title: "How we calculate the Deposited",
          content: "How we calculate the Deposited is lorem ipsum",
        },
      },
      {
        content: `0%`,
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
  // combinedDeposited
  if (threeXStakingData?.tvl > numberToBigNumber(0, 18)) {
    threeXProps.tokenIcon.address = threeXStakingData.tokenIcon.address;
    threeXProps.tokenIcon.chainId = threeXStakingData.tokenIcon.chainId;
    threeXProps.tokenName = threeXStakingData.tokenName;
    threeXProps.tokenStatusLabels[1].content = `$${formatAndRoundBigNumber(threeXStakingData.deposited, 18)}`;

    threeXProps.tokenStatusLabels[2].emissions = `${formatAndRoundBigNumber(threeXStakingData.emissions, 18)} POP`;

    threeXProps.tokenStatusLabels[2].content = `${formatAndRoundBigNumber(threeXStakingData.vAPR, 18)}%`;

    threeXProps.tokenStatusLabels[3].content = `$${formatAndRoundBigNumber(threeXStakingData.tvl, 18)}`;

    threeXTotalBigNumberValues = {
      deposited: threeXStakingData.deposited,
      tvl: threeXStakingData.tvl,
      vAPR: threeXStakingData.vAPR,
      earned: threeXStakingData.earned,
    };
  }
  return {
    threeXProps,
    threeXHasValue: threeXStakingData.deposited > numberToBigNumber(0, 18),
    threeXTotalBigNumberValues,
  };
}
