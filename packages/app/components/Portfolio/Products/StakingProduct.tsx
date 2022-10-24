import { FeatureToggleContext } from "context/FeatureToggleContext";
import useMultipleStakingData from "hooks/portfolio/useMultipleStakingData";
import useGetMultipleStakingPools from "hooks/staking/useGetMultipleStakingPools";
import usePopLocker from "hooks/staking/usePopLocker";
import useWeb3 from "hooks/useWeb3";
import { useContext } from "react";
import PortfolioItem from "../PortfolioItem";
import EarnedRewardsButton from "./EarnedRewardsButton";
import StakingProductItem from "./StakingProductItem";

const StakingProduct = () => {
  let formatter = Intl.NumberFormat("en", {
    //@ts-ignore
    notation: "compact",
  });

  const {
    contractAddresses: {
      popStaking,
      staking,
      pop,
      popUsdcArrakisVaultStaking,
      butter,
      popUsdcLp,
      popUsdcArrakisVault,
      threeX,
    },
    chainId,
    pushWithinChain,
    account,
  } = useWeb3();

  const { data: popLocker, isValidating: popLockerIsValidating, error: popError } = usePopLocker(popStaking);
  const { data: stakingPools, isValidating: stakingPoolsIsValidating } = useGetMultipleStakingPools(staking);

  const { features } = useContext(FeatureToggleContext);

  const displayedStakingPools = features["migrationAlert"]
    ? stakingPools
    : stakingPools?.filter((pool) => pool.address !== popUsdcArrakisVaultStaking);

  const { totalDeposited, totalTVL, totalVAPR, totalEarned, totalContracts } = useMultipleStakingData(chainId, [
    ...(displayedStakingPools ? displayedStakingPools : []),
    ...[popLocker ? popLocker : []],
  ]);

  const badge = {
    text: `${totalContracts} contracts`,
    textColor: "text-black",
    bgColor: "bg-customYellow",
  };

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
      {parseInt(totalContracts) > 0 && (
        <PortfolioItem title="Staking" statusLabels={statusLabels} badge={badge}>
          <StakingProductItem stakingPool={popLocker} />
          {displayedStakingPools &&
            displayedStakingPools.map((pool, index) => <StakingProductItem stakingPool={pool} key={index} />)}

          {totalEarned && (
            <EarnedRewardsButton
              title="Total Unclaimed Rewards"
              amount={totalEarned}
              buttonLabel="Rewards Page"
              link="/rewards"
            />
          )}
        </PortfolioItem>
      )}
    </>
  );
};

export default StakingProduct;
