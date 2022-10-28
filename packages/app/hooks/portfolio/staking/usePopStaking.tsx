import { ChainId, formatAndRoundBigNumber, networkLogos, networkMap, numberToBigNumber } from "@popcorn/utils";
import usePopLocker from "hooks/staking/usePopLocker";
import { useDeployment } from "hooks/useDeployment";
import useStakingData from "./useStakingData";

export default function usePopStaking() {
  const { Ethereum, Polygon } = ChainId;
  const { popStaking: popStakingEthAddress } = useDeployment(Ethereum);
  const { popStaking: popStakingPolygonAddress } = useDeployment(Polygon);
  const { data: popLockerEth } = usePopLocker(popStakingEthAddress, Ethereum);
  const { data: popLockerPolygon } = usePopLocker(popStakingPolygonAddress, Polygon);
  const ethereumPopStaking = useStakingData(popLockerEth, Ethereum);
  const polygonPopStaking = useStakingData(popLockerPolygon, Polygon);

  const popStakingPools = [ethereumPopStaking, polygonPopStaking];

  const combinedDeposited = popStakingPools.reduce((prev, pool) => prev.add(pool.deposited), numberToBigNumber(0, 18));

  const combinedTVL = popStakingPools.reduce((prev, pool) => prev.add(pool.tvl), numberToBigNumber(0, 18));

  const combinedEmissions = popStakingPools.reduce((prev, pool) => prev.add(pool.emissions), numberToBigNumber(0, 18));

  const combinedVAPRSum = popStakingPools.reduce((prev, pool) => prev.add(pool.vAPR), numberToBigNumber(0, 18));

  const combinedVAPRAvg = combinedVAPRSum.div(numberToBigNumber(popStakingPools.length, 18));
  console.log(combinedVAPRAvg.toString());
  let productProps = {
    tokenIcon: {
      address: "",
      chainId: Ethereum,
    },
    tokenName: ``,
    tokenStatusLabels: [
      {
        image: (
          <div className="flex space-x-1">
            <img src={networkLogos[Ethereum]} alt={`${networkMap[Ethereum]}-logo`} className="h-5 w-5 object-contain" />
            <img src={networkLogos[Polygon]} alt={`${networkMap[Polygon]}-logo`} className="h-5 w-5 object-contain" />
          </div>
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
  if (combinedTVL > numberToBigNumber(0, 18)) {
    productProps.tokenIcon.address = popStakingPools[0].tokenIcon.address;
    productProps.tokenIcon.chainId = popStakingPools[0].tokenIcon.chainId;
    productProps.tokenName = popStakingPools[0].tokenName;
    productProps.tokenStatusLabels[1].content = `$${formatAndRoundBigNumber(combinedDeposited, 18)}`;

    productProps.tokenStatusLabels[2].content = `${combinedVAPRAvg.toString()}%`;

    productProps.tokenStatusLabels[2].emissions = `${formatAndRoundBigNumber(combinedEmissions, 18)} POP`;

    productProps.tokenStatusLabels[3].content = `$${formatAndRoundBigNumber(combinedTVL, 18)}`;

    //  combinedVAPRAvg
  }
  return productProps;
}
