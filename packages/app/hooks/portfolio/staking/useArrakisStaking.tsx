import { ChainId, formatAndRoundBigNumber, networkLogos, networkMap, numberToBigNumber } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import useStakingPool from "hooks/staking/useStakingPool";
import { useDeployment } from "hooks/useDeployment";
import useStakingData from "./useStakingData";

export default function useArrakisStaking() {
  const { Polygon } = ChainId;
  const { popUsdcArrakisVaultStaking } = useDeployment(Polygon);
  const { data: popArrakisPool } = useStakingPool(popUsdcArrakisVaultStaking, Polygon);

  const popArrakisStakingData = useStakingData(popArrakisPool, Polygon);

  let arrakisTotalBigNumberValues: { deposited: BigNumber; tvl: BigNumber; vAPR: BigNumber } = {
    deposited: numberToBigNumber(0, 18),
    tvl: numberToBigNumber(0, 18),
    vAPR: numberToBigNumber(0, 18),
  };

  let arrakisProps = {
    tokenIcon: {
      address: "",
      chainId: Polygon,
    },
    tokenName: ``,
    tokenStatusLabels: [
      {
        image: (
          <img src={networkLogos[Polygon]} alt={`${networkMap[Polygon]}-logo`} className="h-5 w-5 object-contain" />
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
          id: "arrakis-deposited",
          title: "How we calculate the Deposited",
          content: "How we calculate the Deposited is lorem ipsum",
        },
      },
      {
        content: `0%`,
        label: "vAPR",
        emissions: `0 POP`,
        infoIconProps: {
          id: "arrakis-vapr",
          title: "How we calculate the vAPR",
          content: "How we calculate the Deposited is lorem ipsum",
        },
      },
      {
        content: `$0`,
        label: "TVL",
        infoIconProps: {
          id: "arrakis-tvl",
          title: "How we calculate the TVL",
          content: "How we calculate the Deposited is lorem ipsum",
        },
      },
    ],
  };
  // combinedDeposited
  if (popArrakisStakingData?.tvl > numberToBigNumber(0, 18)) {
    arrakisProps.tokenIcon.address = popArrakisStakingData.tokenIcon.address;
    arrakisProps.tokenIcon.chainId = popArrakisStakingData.tokenIcon.chainId;
    arrakisProps.tokenName = popArrakisStakingData.tokenName;

    arrakisProps.tokenStatusLabels[1].content = `$${formatAndRoundBigNumber(popArrakisStakingData.deposited, 18)}`;

    arrakisProps.tokenStatusLabels[2].emissions = `${formatAndRoundBigNumber(popArrakisStakingData.emissions, 18)} POP`;

    arrakisProps.tokenStatusLabels[2].content = `${formatAndRoundBigNumber(popArrakisStakingData.vAPR, 18)}%`;

    arrakisProps.tokenStatusLabels[3].content = `$${formatAndRoundBigNumber(popArrakisStakingData.tvl, 18)}`;

    arrakisTotalBigNumberValues = {
      deposited: popArrakisStakingData.deposited,
      tvl: popArrakisStakingData.tvl,
      vAPR: popArrakisStakingData.vAPR,
    };
  }
  return {
    arrakisProps,
    arrakisHasValue: popArrakisStakingData.deposited > numberToBigNumber(0, 18),
    arrakisTotalBigNumberValues,
  };
}
