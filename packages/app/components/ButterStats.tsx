import { formatAndRoundBigNumber, localStringOptions } from "@popcorn/utils";
import { BatchMetadata } from "@popcorn/utils/types";
import StatusWithLabel from "components/Common/StatusWithLabel";
import { constants } from "ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";
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
    butterStaking ? formatAndRoundBigNumber(butterStaking.apy, butterData?.tokens?.butter?.decimals) : "-"
  }%). You must stake your ${
    isThreeX ? "3X" : "BTR"
  } to receive the additional vAPR in POP. 90% of earned POP rewards are vested over one year.`;

  return (
    <div className="flex flex-row flex-wrap items-start md:items-center mt-8 gap-8 md:gap-0 md:space-x-6">
      <StatusWithLabel
        content={
          butterAPY && butterStaking && butterStaking?.apy?.gte(constants.Zero)
            ? formatAndRoundBigNumber(
                butterStaking.apy.add(parseUnits(String(butterAPY))),
                butterData?.tokens?.butter?.decimals,
              ) + "%"
            : "..."
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
          setToken && supply
            ? `$${formatAndRoundBigNumber(
                supply.mul(setToken.price).div(parseEther("1")),
                butterData?.tokens?.butter?.decimals,
              )}`
            : "$ ..."
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
    </div>
  );
}
