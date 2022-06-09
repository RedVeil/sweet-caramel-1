import { bigNumberToNumber, formatAndRoundBigNumber, localStringOptions } from "@popcorn/utils";
import { ButterBatchData } from "@popcorn/utils/types";
import StatusWithLabel from "components/Common/StatusWithLabel";
import { constants } from "ethers";
import { parseEther } from "ethers/lib/utils";
import useGetButterAPY from "hooks/butter/useGetButterAPY";
import useStakingPool from "hooks/staking/useStakingPool";
import useWeb3 from "hooks/useWeb3";

export interface ButterStatsProps {
  butterData: ButterBatchData;
  center?: boolean;
}

const SocialImpactInfoProps = {
  content:
    "Approximately one-third of all fees collected by Popcorn are donated to social impact and non-profit organizations selected by POP token holders.",
  id: "socialImpact",
  title: "Social Impact",
};

export default function ButterStats({ butterData, center = false }: ButterStatsProps) {
  const { contractAddresses } = useWeb3();
  const { data: butterAPY } = useGetButterAPY();
  const { data: butterStaking } = useStakingPool(contractAddresses.butterStaking);

  const apyInfoText = `This is the estimated Annual Percentage Yield. The shown APY comes from yield on the underlying stablecoins (${
    butterAPY ? butterAPY.toLocaleString(undefined, localStringOptions) : "-"
  }%) and is boosted with POP (${
    butterStaking ? formatAndRoundBigNumber(butterStaking.apy, 2) : "-"
  }%). You must stake your BTR to receive the additional APY in POP. 90% of earned POP rewards are vested over one year.`;
  return (
    <div className={`flex flex-row flex-wrap items-center mt-4 justify-center ${!center && "md:justify-start"}`}>
      <div className={`${!center && "border-gray-200 border-r-2 pr-6"} md:border-gray-200 md:border-r-2 md:pr-6 mt-2`}>
        <div className="hidden md:block">
          <StatusWithLabel
            content={
              butterAPY && butterStaking && butterStaking?.apy?.gte(constants.Zero)
                ? (butterAPY + bigNumberToNumber(butterStaking.apy)).toLocaleString(undefined, localStringOptions) + "%"
                : "New 🍿✨"
            }
            label="Est. APY"
            green
            infoIconProps={{
              id: "estApy",
              title: "How we calculate the APY",
              content: apyInfoText,
            }}
          />
        </div>
        <div className="md:hidden">
          <StatusWithLabel
            content={
              butterData?.batchProcessTokens?.butter && butterData?.butterSupply
                ? `$${formatAndRoundBigNumber(
                    butterData?.butterSupply.mul(butterData?.batchProcessTokens?.butter.price).div(parseEther("1")),
                  )}`
                : "$-"
            }
            label="Total Deposits"
          />
        </div>
      </div>
      <div className={`${!center && "border-gray-200 pl-6"} md:border-gray-200 md:border-r-2 md:px-6 mt-2`}>
        <div className="hidden md:block ">
          <StatusWithLabel
            content={
              butterData?.batchProcessTokens?.butter && butterData?.butterSupply
                ? `$${formatAndRoundBigNumber(
                    butterData?.butterSupply.mul(butterData?.batchProcessTokens?.butter.price).div(parseEther("1")),
                  )}`
                : "$-"
            }
            label="Total Deposits"
          />
        </div>
        <div className="md:hidden">
          <StatusWithLabel content={`Coming Soon`} label="Social Impact" infoIconProps={SocialImpactInfoProps} />
        </div>
      </div>
      <div className="w-full md:w-auto mt-2 md:pl-6 text-center md:text-left">
        <div className="hidden md:block ">
          <StatusWithLabel content={`Coming Soon`} label="Social Impact" infoIconProps={SocialImpactInfoProps} />
        </div>
        <div className="w-full md:hidden flex justify-center">
          <StatusWithLabel
            content={
              butterAPY && butterStaking && butterStaking?.apy?.gte(constants.Zero)
                ? (butterAPY + bigNumberToNumber(butterStaking.apy)).toLocaleString(undefined, localStringOptions) + "%"
                : "New 🍿✨"
            }
            label="Est. APY"
            green
            infoIconProps={{
              id: "estApy",
              title: "How we calculate the APY",
              content: apyInfoText,
            }}
          />
        </div>
      </div>
    </div>
  );
}
