import { ChainId, formatAndRoundBigNumber, networkLogos, networkMap, numberToBigNumber } from "@popcorn/utils";
import useStakingPool from "hooks/staking/useStakingPool";
import { useDeployment } from "hooks/useDeployment";
import useStakingData from "./useStakingData";

export default function useButterStaking() {
  const { Ethereum } = ChainId;
  const { butterStaking } = useDeployment(Ethereum);
  const { data: butterPool } = useStakingPool(butterStaking, Ethereum);

  const butterStakingData = useStakingData(butterPool, Ethereum);

  let productProps = {
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
    productProps.tokenIcon.address = butterStakingData.tokenIcon.address;
    productProps.tokenIcon.chainId = butterStakingData.tokenIcon.chainId;
    productProps.tokenName = butterStakingData.tokenName;
    productProps.tokenStatusLabels[1].content = `$${formatAndRoundBigNumber(butterStakingData.deposited, 18)}`;

    productProps.tokenStatusLabels[2].emissions = `${formatAndRoundBigNumber(butterStakingData.emissions, 18)} POP`;

    productProps.tokenStatusLabels[2].content = `${formatAndRoundBigNumber(butterStakingData.vAPR, 18)}%`;

    productProps.tokenStatusLabels[3].content = `$${formatAndRoundBigNumber(butterStakingData.tvl, 18)}`;
  }
  return productProps;
}
