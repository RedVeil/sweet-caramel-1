import {
  calculateMultipleAPY,
  ChainId,
  formatAndRoundBigNumber,
  networkLogos,
  networkMap,
  numberToBigNumber,
} from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
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

  const combinedEarned = popStakingPools.reduce((prev, pool) => prev.add(pool.earned), numberToBigNumber(0, 18));

  let popTotalBigNumberValues: { deposited: BigNumber; tvl: BigNumber; vAPR: BigNumber; earned: BigNumber } = {
    deposited: numberToBigNumber(0, 18),
    tvl: numberToBigNumber(0, 18),
    vAPR: numberToBigNumber(0, 18),
    earned: numberToBigNumber(0, 18),
  };

  const combinedVAPR =
    combinedDeposited > numberToBigNumber(0, 18)
      ? calculateMultipleAPY(popStakingPools, combinedDeposited)
      : numberToBigNumber(0, 18);
  let popProductProps = {
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
  if (combinedDeposited > numberToBigNumber(0, 18)) {
    popProductProps.tokenIcon.address = popStakingPools[0].tokenIcon.address;
    popProductProps.tokenIcon.chainId = popStakingPools[0].tokenIcon.chainId;
    popProductProps.tokenName = popStakingPools[0].tokenName;
    popProductProps.tokenStatusLabels[1].content = `$${formatAndRoundBigNumber(combinedDeposited, 18)}`;

    popProductProps.tokenStatusLabels[2].content = `${formatAndRoundBigNumber(combinedVAPR, 18)}%`;

    popProductProps.tokenStatusLabels[2].emissions = `${formatAndRoundBigNumber(combinedEmissions, 18)} POP`;

    popProductProps.tokenStatusLabels[3].content = `$${formatAndRoundBigNumber(combinedTVL, 18)}`;

    popTotalBigNumberValues = {
      deposited: combinedDeposited,
      tvl: combinedTVL,
      vAPR: combinedVAPR,
      earned: combinedEarned,
    };
  }
  return {
    popProductProps,
    popHasValue: combinedDeposited > numberToBigNumber(0, 18),
    popTotalBigNumberValues,
  };
}
