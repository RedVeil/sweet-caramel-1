import { ChainId, formatAndRoundBigNumber, networkLogos, networkMap, numberToBigNumber } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import useStakingPool from "hooks/staking/useStakingPool";
import { useDeployment } from "hooks/useDeployment";
import useStakingData from "./useStakingData";

export default function useButterStaking() {
  const { Ethereum } = ChainId;
  const { butterStaking } = useDeployment(Ethereum);
  const { data: butterPool } = useStakingPool(butterStaking, Ethereum);

  const butterStakingData = useStakingData(butterPool, Ethereum);

  let butterTotalBigNumberValues: { deposited: BigNumber; tvl: BigNumber; vAPR: BigNumber; earned?: BigNumber } = {
    deposited: numberToBigNumber(0, 18),
    tvl: numberToBigNumber(0, 18),
    vAPR: numberToBigNumber(0, 18),
    earned: numberToBigNumber(0, 18),
  };

  let butterProps = {
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
  if (butterStakingData?.tvl > numberToBigNumber(0, 18)) {
    butterProps.tokenIcon.address = butterStakingData.tokenIcon.address;
    butterProps.tokenIcon.chainId = butterStakingData.tokenIcon.chainId;
    butterProps.tokenName = butterStakingData.tokenName;
    butterProps.tokenStatusLabels[1].content = `$${formatAndRoundBigNumber(butterStakingData.deposited, 18)}`;

    butterProps.tokenStatusLabels[2].emissions = `${formatAndRoundBigNumber(butterStakingData.emissions, 18)} POP`;

    butterProps.tokenStatusLabels[2].content = `${formatAndRoundBigNumber(butterStakingData.vAPR, 18)}%`;

    butterProps.tokenStatusLabels[3].content = `$${formatAndRoundBigNumber(butterStakingData.tvl, 18)}`;

    butterTotalBigNumberValues = {
      deposited: butterStakingData.deposited,
      tvl: butterStakingData.tvl,
      vAPR: butterStakingData.vAPR,
      earned: butterStakingData.earned,
    };
  }
  return {
    butterProps,
    butterHasValue: butterStakingData.deposited > numberToBigNumber(0, 18),
    butterTotalBigNumberValues,
  };
}
