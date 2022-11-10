import { ChainId, formatAndRoundBigNumber } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";
import useButterNetworth from "hooks/netWorth/useButterNetworth";
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
  const {
    butterStaking: butterStakingAddress,
    usdc: usdcAddress,
    threeCrv: threeCrvAddress,
    butter,
  } = useDeployment(Ethereum);
  const { data: butterBatchData } = useButterBatchData(Ethereum);
  const { data: butterWhaleData } = useButterWhaleData(Ethereum);
  const threeCrv = useMemo(
    () => butterBatchData?.tokens?.find((token) => token.address === threeCrvAddress),
    [butterBatchData, butterWhaleData],
  );
  const butterToken = useMemo(
    () => butterBatchData?.tokens?.find((token) => token.address === butter),
    [butterWhaleData, butterBatchData],
  );
  const {} = useDeployment(Ethereum);
  const yearnAddresses = useSetComponentAddresses(butterToken?.address);
  const { data: butterAPY } = useGetYearnAPY(yearnAddresses, ChainId.Ethereum);
  const { data: butterStaking } = useStakingPool(butterStakingAddress, Ethereum);
  const tokenSupply = useTotalTokenSupply(butterToken?.address, Ethereum);
  const networkName = useNetworkName();
  const { butterHoldings } = useButterNetworth();

  const totalDeposited = useCallback(() => {
    if (butterHoldings) {
      return formatAndRoundBigNumber(butterHoldings, 18);
    }
    return "5";
  }, [butterHoldings])();

  const totalTVL = butterToken?.price
    ? formatAndRoundBigNumber(tokenSupply.mul(butterToken?.price).div(parseEther("1")), butterToken?.decimals)
    : "0";

  const totalVAPR =
    butterStaking?.apy && butterToken
      ? formatAndRoundBigNumber(butterStaking.apy.add(parseUnits(String(butterAPY || 0))), butterToken?.decimals)
      : "0";

  const getBatchProgressAmount = () => {
    if (!butterBatchData) {
      return BigNumber.from("0");
    }
    return butterToken.redeeming
      ? butterBatchData?.currentBatches.redeem.suppliedTokenBalance.mul(butterToken.price).div(parseEther("1"))
      : butterBatchData?.currentBatches.mint.suppliedTokenBalance.mul(threeCrv.price).div(parseEther("1"));
  };

  const inBatch = formatAndRoundBigNumber(getBatchProgressAmount(), butterToken?.decimals);

  const statusLabels = [
    {
      content: `$${totalTVL}`,
      label: "TVL",
      infoIconProps: {
        id: "butter-product-tvl",
        title: "How we calculate the TVL",
        content: "How we calculate the TVL is lorem ipsum",
      },
    },
    {
      content: `${totalVAPR}%`,
      label: "vAPR",
      infoIconProps: {
        id: "butter-product-vAPR",
        title: "How we calculate the vAPR",
        content:
          "This is the variable annual percentage rate. The shown vAPR comes from yield on the underlying stablecoins  and is boosted with POP. You must stake to receive the additional vAPR in POP. 90% of earned POP rewards are vested over one year.",
      },
    },
    {
      content: `$${totalDeposited}`,
      label: "Deposited",
      infoIconProps: {
        id: "butter-product-deposited",
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
