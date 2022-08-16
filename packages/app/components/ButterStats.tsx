import { bigNumberToNumber, formatAndRoundBigNumber, localStringOptions } from "@popcorn/utils";
import { BatchMetadata } from "@popcorn/utils/types";
import StatusWithLabel from "components/Common/StatusWithLabel";
import { constants } from "ethers";
import { parseEther } from "ethers/lib/utils";
import useGetYearnAPY from "hooks/butter/useGetYearnAPY";
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

  const apyInfoText = `This is the variable annual percentage rate. The shown vAPR comes from yield on the underlying stablecoins (${butterAPY ? butterAPY.toLocaleString(undefined, localStringOptions) : "-"
    }%) and is boosted with POP (${butterStaking ? formatAndRoundBigNumber(butterStaking.apy, 2) : "-"
    }%). You must stake your ${isThreeX ? "3X" : "BTR"
    } to receive the additional vAPR in POP. 90% of earned POP rewards are vested over one year.`;

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
            label={
              <>
                <span className="lowercase">v</span>APR
              </>
            }
            green
            infoIconProps={{
              id: "vAPR",
              title: "How we calculate the vAPR",
              content: apyInfoText,
            }}
          />
        </div>
        <div className="md:hidden">
          <StatusWithLabel
            content={
              setToken && supply ? `$${formatAndRoundBigNumber(supply.mul(setToken.price).div(parseEther("1")))}` : "$-"
            }
            label="Total Deposits"
          />
        </div>
      </div>
      <div className={`${!center && "border-gray-200 pl-6"} md:border-gray-200 md:border-r-2 md:px-6 mt-2`}>
        <div className="hidden md:block ">
          <StatusWithLabel
            content={
              setToken && supply ? `$${formatAndRoundBigNumber(supply.mul(setToken.price).div(parseEther("1")))}` : "$-"
            }
            label="Total Deposits"
          />
        </div>
        <div className="md:hidden">
          {isThreeX ? (
            <StatusWithLabel content={"$1m"} label="TVL Limit" />
          ) : (
            <StatusWithLabel content={`Coming Soon`} label="Social Impact" infoIconProps={SocialImpactInfoProps} />
          )}
        </div>
      </div>
      <div className="w-full md:w-auto mt-2 md:pl-6 text-center md:text-left">
        <div className="hidden md:block ">
          {isThreeX ? (
            <StatusWithLabel content={"$1m"} label="TVL Limit" />
          ) : (
            <StatusWithLabel content={`Coming Soon`} label="Social Impact" infoIconProps={SocialImpactInfoProps} />
          )}
        </div>
        <div className="w-full md:hidden flex justify-center">
          <StatusWithLabel
            content={
              butterAPY && butterStaking && butterStaking?.apy?.gte(constants.Zero)
                ? (butterAPY + bigNumberToNumber(butterStaking.apy)).toLocaleString(undefined, localStringOptions) + "%"
                : "New 🍿✨"
            }
            label={
              <>
                <span className="lowercase">v</span>APR
              </>
            }
            green
            infoIconProps={{
              id: "vAPR",
              title: "How we calculate the vAPR",
              content: apyInfoText,
            }}
          />
        </div>
      </div>
    </div>
  );
}
