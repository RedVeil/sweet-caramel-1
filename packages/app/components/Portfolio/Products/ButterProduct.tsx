import { ChainId, formatAndRoundBigNumber } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";
import useButterBatchData from "hooks/set/useButterBatchData";
import useButterWhaleData from "hooks/set/useButterWhaleData";
import useGetYearnAPY from "hooks/set/useGetYearnAPY";
import useSetComponentAddresses from "hooks/set/useSetComponentAddresses";
import useStakingPool from "hooks/staking/useStakingPool";
import useTotalTokenSupply from "hooks/tokens/useTotalTokenSupply";
import { useDeployment } from "hooks/useDeployment";
import useNetworkName from "hooks/useNetworkName";
import { useCallback, useMemo } from "react";
import PortfolioItem from "../PortfolioItem";
import EarnedRewardsButton from "./EarnedRewardsButton";

const ButterProduct = () => {
  let formatter = Intl.NumberFormat("en", {
    //@ts-ignore
    notation: "compact",
  });
  const { Ethereum, Polygon } = ChainId;
  const contractAddresses = useDeployment(Ethereum);
  const {
    data: butterBatchData,
    error: errorFetchingButterBatchData,
    mutate: refetchButterBatchData,
  } = useButterBatchData(Ethereum);
  const {
    data: butterWhaleData,
    error: butterWhaleError,
    mutate: refetchButterWhaleData,
  } = useButterWhaleData(Ethereum);
  const butterToken = useMemo(
    () => butterBatchData?.tokens?.find((token) => token.address === contractAddresses.butter),
    [butterWhaleData, butterBatchData],
  );
  const usdc = useMemo(
    () => butterBatchData?.tokens?.find((token) => token.address === contractAddresses.usdc),
    [butterWhaleData, butterBatchData],
  );
  const { butter, butterStaking: butterStakingAddress } = useDeployment(Ethereum);
  const yearnAddresses = useSetComponentAddresses(butterToken?.address);
  const { data: butterAPY } = useGetYearnAPY(yearnAddresses, ChainId.Ethereum);
  const { data: butterStaking } = useStakingPool(butterStakingAddress, Ethereum);
  const tokenSupply = useTotalTokenSupply(butterToken?.address, Ethereum);
  const networkName = useNetworkName();
  console.log(butterBatchData?.totalSupply.toString());

  // const totalDeposited = formatAndRoundBigNumber(totalDepositedBigNumber, 18);
  const totalDeposited = "0";

  const totalTVL = butterToken?.price
    ? formatAndRoundBigNumber(tokenSupply.mul(butterToken?.price).div(parseEther("1")), butterToken?.decimals)
    : "0";

  const totalVAPR =
    butterStaking?.apy && butterToken
      ? formatAndRoundBigNumber(butterStaking.apy.add(parseUnits(String(butterAPY || 0))), butterToken?.decimals)
      : "0";

  const getBatchProgressAmount = useCallback(() => {
    if (!butterBatchData || !butterToken?.price || !usdc?.price) {
      return BigNumber.from("0");
    }
    return butterToken.redeeming
      ? butterBatchData?.currentBatches.redeem.suppliedTokenBalance.mul(butterToken?.price).div(parseEther("1"))
      : butterBatchData?.currentBatches.mint.suppliedTokenBalance.mul(usdc?.price).div(BigNumber.from(1_000_000));
  }, [butterToken?.price, usdc?.price]);

  const inBatch = formatAndRoundBigNumber(getBatchProgressAmount(), butterToken?.decimals);

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
      <PortfolioItem title="Butter" statusLabels={statusLabels}>
        {inBatch && (
          <EarnedRewardsButton
            title="In Batch"
            amount={inBatch}
            buttonLabel="Butter Main Page"
            link={`/${networkName}/set/butter`}
          />
        )}
      </PortfolioItem>
    </>
  );
};

export default ButterProduct;
