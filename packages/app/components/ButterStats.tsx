import { bigNumberToNumber, formatAndRoundBigNumber, localStringOptions } from "@popcorn/utils";
import { BatchMetadata } from "@popcorn/utils/types";
import StatusWithLabel from "components/Common/StatusWithLabel";
import { constants } from "ethers";
import { parseEther } from "ethers/lib/utils";
import useGetYearnAPY from "hooks/set/useGetYearnAPY";
import useStakingPool from "hooks/staking/useStakingPool";
import useWeb3 from "hooks/useWeb3";

export interface ButterStatsProps {
  butterData: BatchMetadata;
  center?: boolean;
  isThreeX?: boolean;
  addresses: string[];
}

export default function ButterStats({ butterData, center = false, isThreeX = false, addresses }: ButterStatsProps) {
  const isReady = typeof butterData !== "undefined";
  const SocialImpactInfoProps = {
    content:
      "Approximately one-third of all fees collected by Popcorn are donated to social impact and non-profit organizations selected by POP token holders.",
    id: "socialImpact",
    title: "Social Impact",
  };
  const { contractAddresses } = useWeb3();
  const { data: butterAPY } = useGetYearnAPY(addresses);
  const { data: butterStaking } = useStakingPool(
    isThreeX ? contractAddresses.threeXStaking : contractAddresses.butterStaking,
  );
  const supply = isReady && butterData.totalSupply;
  const setToken = isThreeX ? butterData?.tokens?.threeX : butterData?.tokens?.butter;

  const apyInfoText = `This is the variable annual percentage rate. The shown vAPR comes from yield on the underlying stablecoins (${
    butterAPY ? butterAPY.toLocaleString(undefined, localStringOptions) : "-"
  }%) and is boosted with POP (${
    butterStaking ? formatAndRoundBigNumber(butterStaking.apy, 2) : "-"
  }%). You must stake your ${
    isThreeX ? "3X" : "BTR"
  } to receive the additional vAPR in POP. 90% of earned POP rewards are vested over one year.`;

  return (
    <div className="flex flex-row flex-wrap items-start md:items-center mt-8 gap-8 md:gap-6">
      <StatusWithLabel
        content={
          butterAPY && butterStaking && butterStaking?.apy?.gte(constants.Zero)
            ? (butterAPY + bigNumberToNumber(butterStaking.apy)).toLocaleString(undefined, localStringOptions) + "%"
            : "$5,000,000"
        }
        label={
          <>
            <span className="lowercase">v</span>APR
          </>
        }
        infoIconProps={{
          id: "vAPR",
          title: "How we calculate the vAPR",
          content: apyInfoText,
        }}
      />
      <div className="bg-gray-300 h-16 hidden md:block" style={{ width: "1px" }}></div>
      <StatusWithLabel
        content={
          setToken && supply ? `$${formatAndRoundBigNumber(supply.mul(setToken.price).div(parseEther("1")))}` : "$-"
        }
        label="Total Deposits"
      />
      <div className="bg-gray-300 h-16 hidden md:block" style={{ width: "1px" }}></div>

      <>
        {isThreeX ? (
          <StatusWithLabel content={"$1m"} label="TVL Limit" />
        ) : (
          <StatusWithLabel content={`Coming Soon`} label="Social Impact" infoIconProps={SocialImpactInfoProps} />
        )}
      </>

      {/* <div className={`flex flex-col md:flex-row flex-wrap items-start md:items-center mt-4`}>
				<div className={` pr-6 md:pr-6 mt-6 md:mt-2`}>
					<div className="block">
						<StatusWithLabel
							content={
								butterAPY && butterStaking && butterStaking?.apy?.gte(constants.Zero)
									? (butterAPY + bigNumberToNumber(butterStaking.apy)).toLocaleString(undefined, localStringOptions) +
									"%"
									: "New 🍿✨"
							}
							label={
								<>
									<span className="lowercase">v</span>APR
								</>
							}
							infoIconProps={{
								id: "vAPR",
								title: "How we calculate the vAPR",
								content: apyInfoText,
							}}
						/>
					</div>
				</div>
				<div className="bg-gray-300 h-16 hidden md:block" style={{ width: "1px" }}></div>
				<div className="md:pl-6 md:px-6 mt-6 md:mt-2">
					<div className="block ">
						<StatusWithLabel
							content={
								setToken && supply
									? `$${formatAndRoundBigNumber(supply.mul(setToken.price).div(parseEther("1")))}`
									: "$-"
							}
							label="Total Deposits"
						/>
					</div>
				</div>
			</div>
			<div className="w-full md:w-auto mt-6 md:mt-8">
				<div className="block ">
					{isThreeX ? (
						<StatusWithLabel content={"$1m"} label="TVL Limit" />
					) : (
						<StatusWithLabel content={`Coming Soon`} label="Social Impact" infoIconProps={SocialImpactInfoProps} />
					)}
				</div>
			</div> */}
    </div>
  );
}
