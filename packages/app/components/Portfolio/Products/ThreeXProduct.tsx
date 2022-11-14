import { ChainId, formatAndRoundBigNumber } from "@popcorn/utils";
import { BigNumber } from "ethers/lib/ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";
import useThreeXNetworth from "hooks/netWorth/useThreeXNetworth";
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
  const { threeXStaking: threeXStakingAddress, usdc: usdcAddress, threeX } = useDeployment(Ethereum);
  const { data: threeXData } = useThreeXData(Ethereum);
  const { data: threeXWhaleData } = useThreeXWhaleData(Ethereum);
  const threeXToken = useMemo(
    () => threeXData?.tokens?.find((token) => token.address === threeX),
    [threeXWhaleData, threeXData],
  );
  const usdc = useMemo(
    () => threeXData?.tokens?.find((token) => token.address === usdcAddress),
    [threeXWhaleData, threeXData],
  );
  const yearnAddresses = useSetComponentAddresses(threeXToken?.address);
  const { data: threeXAPY } = useGetYearnAPY(yearnAddresses, ChainId.Ethereum);
  const { data: threeXStaking } = useStakingPool(threeXStakingAddress, Ethereum);
  const tokenSupply = useTotalTokenSupply(threeXToken?.address, Ethereum);
  const networkName = useNetworkName();
  const { threeXHoldings } = useThreeXNetworth();

  const totalDeposited = useCallback(() => {
    if (threeXHoldings) {
      return formatAndRoundBigNumber(threeXHoldings, 18);
    }
    return "0";
  }, [threeXHoldings])();

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
        id: "threex-product-tvl",
        title: "How we calculate the TVL",
        content: "How we calculate the TVL is lorem ipsum",
      },
    },
    {
      content: `${totalVAPR}%`,
      label: "vAPR",
      infoIconProps: {
        id: "threex-product-vAPR",
        title: "How we calculate the vAPR",
        content:
          "This is the variable annual percentage rate. The shown vAPR comes from yield on the underlying stablecoins  and is boosted with POP. You must stake to receive the additional vAPR in POP. 90% of earned POP rewards are vested over one year.",
      },
    },
    {
      content: `$${totalDeposited}`,
      label: "Deposited",
      infoIconProps: {
        id: "threex-product-deposited",
        title: "How we calculate the Deposited",
        content: "How we calculate the Deposited is lorem ipsum",
      },
    },
  ];

  return (
    <>
      <PortfolioItem title="3X" statusLabels={statusLabels} show={totalDeposited !== "0"}>
        {inBatch && (
          <EarnedRewardsButton
            title="In Batch"
            amount={inBatch}
            buttonLabel="3X Main Page"
            link={`/${networkName}/set/3x`}
          />
        )}
      </PortfolioItem>
    </>
  );
};

export default ThreeXProduct;
