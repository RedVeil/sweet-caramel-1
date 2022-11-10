import { ChainId, formatAndRoundBigNumber } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";
import useGetYearnAPY from "hooks/set/useGetYearnAPY";
import useSetComponentAddresses from "hooks/set/useSetComponentAddresses";
import useThreeXData from "hooks/set/useThreeXData";
import useThreeXWhaleData from "hooks/set/useThreeXWhaleData";
import useStakingPool from "hooks/staking/useStakingPool";
import useTotalTokenSupply from "hooks/tokens/useTotalTokenSupply";
import { useDeployment } from "hooks/useDeployment";
import useNetworkName from "hooks/useNetworkName";
import { useCallback, useMemo } from "react";
import PortfolioItem from "../PortfolioItem";
import EarnedRewardsButton from "./EarnedRewardsButton";

const ThreeXProduct = () => {
  let formatter = Intl.NumberFormat("en", {
    //@ts-ignore
    notation: "compact",
  });
  const { Ethereum, Polygon } = ChainId;
  const contractAddresses = useDeployment(Ethereum);
  const { data: threeXData, error: errorFetchingThreeXData, mutate: refetchThreeXBatchData } = useThreeXData(Ethereum);
  const {
    data: threeXWhaleData,
    error: errorFetchingThreeXWhaleData,
    mutate: refetchThreeXWhaleData,
  } = useThreeXWhaleData(Ethereum);
  const threeXToken = useMemo(
    () => threeXData?.tokens?.find((token) => token.address === contractAddresses.threeX),
    [threeXWhaleData, threeXData],
  );
  const usdc = useMemo(
    () => threeXData?.tokens?.find((token) => token.address === contractAddresses.usdc),
    [threeXWhaleData, threeXData],
  );
  const { threeX, threeXStaking: threeXStakingAddress, butterStaking: butterStakingAddress } = useDeployment(Ethereum);
  const yearnAddresses = useSetComponentAddresses(threeXToken?.address);
  const { data: threeXAPY } = useGetYearnAPY(yearnAddresses, ChainId.Ethereum);
  const { data: threeXStaking } = useStakingPool(threeXStakingAddress, Ethereum);
  const tokenSupply = useTotalTokenSupply(threeXToken?.address, Ethereum);
  const networkName = useNetworkName();
  console.log(threeXData?.totalSupply.toString());

  // const totalDeposited = formatAndRoundBigNumber(totalDepositedBigNumber, 18);
  const totalDeposited = "0";

  const totalTVL = threeXToken?.price
    ? formatAndRoundBigNumber(tokenSupply.mul(threeXToken?.price).div(parseEther("1")), threeXToken?.decimals)
    : "0";

  const totalVAPR =
    threeXStaking?.apy && threeXToken
      ? formatAndRoundBigNumber(threeXStaking.apy.add(parseUnits(String(threeXAPY || 0))), threeXToken?.decimals)
      : "0";

  const getBatchProgressAmount = useCallback(() => {
    if (!threeXData || !threeXToken?.price || !usdc?.price) {
      return BigNumber.from("0");
    }
    return threeXToken.redeeming
      ? threeXData?.currentBatches.redeem.suppliedTokenBalance.mul(threeXToken?.price).div(parseEther("1"))
      : threeXData?.currentBatches.mint.suppliedTokenBalance.mul(usdc?.price).div(BigNumber.from(1_000_000));
  }, [threeXToken?.price, usdc?.price]);

  const inBatch = formatAndRoundBigNumber(getBatchProgressAmount(), threeXToken?.decimals);

  const statusLabels = [
    {
      content: `$${totalTVL}`,
      label: "TVL",
      infoIconProps: {
        id: "staking-tvl",
        title: "How we calculate the TVL",
        content: "How we calculate the TVL is lorem ipsum",
      },
    },
    {
      content: `${totalVAPR}%`,
      label: "vAPR",
      infoIconProps: {
        id: "staking-vAPR",
        title: "How we calculate the vAPR",
        content: "How we calculate the vAPR is lorem ipsum",
      },
    },
    {
      content: `$${totalDeposited}`,
      label: "Deposited",
      infoIconProps: {
        id: "staking-deposited",
        title: "How we calculate the Deposited",
        content: "How we calculate the Deposited is lorem ipsum",
      },
    },
  ];

  return (
    <>
      <PortfolioItem title="3X" statusLabels={statusLabels}>
        {inBatch && (
          <EarnedRewardsButton
            title="In Batch"
            amount={inBatch}
            buttonLabel="3X Main Page"
            link={`/${networkName}/rewards`}
          />
        )}
      </PortfolioItem>
    </>
  );
};

export default ThreeXProduct;
