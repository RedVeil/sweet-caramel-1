import PopStaking from "./PopStaking";

const StakingProduct = () => {
  let formatter = Intl.NumberFormat("en", {
    //@ts-ignore
    notation: "compact",
  });

  // const { Ethereum, Polygon } = ChainId;
  // const ethereum = useDeployment(Ethereum);
  // const { pop, popStaking, popUsdcArrakisVaultStaking } = useDeployment(chainId);
  // const stakingAddresses = useStakingContracts(chainId);

  // const {
  // 	data: popLocker,
  // 	isValidating: popLockerIsValidating,
  // 	error: popError,
  // } = usePopLocker(popStaking, chainId);
  // const { data: stakingPools, isValidating: stakingPoolsIsValidating } = useGetMultipleStakingPools(
  // 	stakingAddresses,
  // 	chainId,
  // );

  // const { totalDeposited, totalTVL, totalVAPR, totalEarned, totalContracts } = useMultipleStakingData(
  // 	chainId,
  // 	[...(stakingPools ? stakingPools : []), ...[popLocker ? popLocker : []]],
  // );

  // const badge = {
  // 	text: `${totalContracts} contracts`,
  // 	textColor: "text-black",
  // 	bgColor: "bg-customYellow",
  // };

  // const statusLabels = [
  // 	{
  // 		content: `$${totalTVL}`,
  // 		label: "TVL",
  // 		infoIconProps: {
  // 			id: "staking-tvl",
  // 			title: "How we calculate the TVL",
  // 			content: "How we calculate the TVL is lorem ipsum",
  // 		},
  // 	},
  // 	{
  // 		content: `${totalVAPR}%`,
  // 		label: "vAPR",
  // 		infoIconProps: {
  // 			id: "staking-vAPR",
  // 			title: "How we calculate the vAPR",
  // 			content: "How we calculate the vAPR is lorem ipsum",
  // 		},
  // 	},
  // 	{
  // 		content: `$${totalDeposited}`,
  // 		label: "Deposited",
  // 		infoIconProps: {
  // 			id: "staking-deposited",
  // 			title: "How we calculate the Deposited",
  // 			content: "How we calculate the Deposited is lorem ipsum",
  // 		},
  // 	},
  // ];

  return (
    // <>
    // 	{parseInt(totalContracts) > 0 && (
    // 		<PortfolioItem title="Staking" statusLabels={statusLabels} badge={badge}>
    // 			{/* <StakingProductItem stakingPool={popLocker} ChainId={chainId} />
    // 			{displayedStakingPools &&
    // 				displayedStakingPools.map((pool, index) => <StakingProductItem stakingPool={pool} key={index} ChainId={chainId} />)} */}

    // 			{totalEarned && (
    // 				<EarnedRewardsButton
    // 					title="Total Unclaimed Rewards"
    // 					amount={totalEarned}
    // 					buttonLabel="Rewards Page"
    // 					link="/rewards"
    // 				/>
    // 			)}
    // 		</PortfolioItem>
    // 	)}
    // </>

    <PopStaking />
  );
};

export default StakingProduct;
