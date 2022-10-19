import { ChainId, formatAndRoundBigNumber, localStringOptions } from "@popcorn/utils";
import { Token } from "@popcorn/utils/types";
import StatusWithLabel from "components/Common/StatusWithLabel";
import { BigNumber, constants } from "ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";
import useGetYearnAPY from "hooks/set/useGetYearnAPY";
import useStakingPool from "hooks/staking/useStakingPool";
import { useDeployment } from "hooks/useDeployment";

export interface ButterStatsProps {
  token: Token;
  totalSupply: BigNumber;
  center?: boolean;
  isThreeX?: boolean;
  addresses: string[];
  chainId: ChainId;
}

export default function ButterStats({
  token,
  totalSupply,
  center = false,
  isThreeX = false,
  addresses: yearnAddresses,
  chainId,
}: ButterStatsProps) {
  const SocialImpactInfoProps = {
    content:
      "Approximately one-third of all fees collected by Popcorn are donated to social impact and non-profit organizations selected by POP token holders.",
    id: "socialImpact",
    title: "Social Impact",
  };

  const { threeXStaking: threeXStakingAddress, butterStaking: butterStakingAddress } = useDeployment(chainId);
  const { data: butterAPY } = useGetYearnAPY(yearnAddresses, chainId);
  const { data: butterStaking } = useStakingPool(isThreeX ? threeXStakingAddress : butterStakingAddress, chainId);

  const apyInfoText = `This is the variable annual percentage rate. The shown vAPR comes from yield on the underlying stablecoins (${butterAPY ? butterAPY.toLocaleString(undefined, localStringOptions) : "-"
    }%) and is boosted with POP (${butterStaking ? formatAndRoundBigNumber(butterStaking.apy, token?.decimals) : "-"
    }%). You must stake your ${isThreeX ? "3X" : "BTR"
    } to receive the additional vAPR in POP. 90% of earned POP rewards are vested over one year.`;

  return (
    <div className="flex flex-row flex-wrap items-start md:items-center mt-8 gap-8 md:gap-0 md:space-x-6">
      <StatusWithLabel
        content={
          butterStaking?.apy?.add(parseUnits(String(butterAPY || 0))).gte(constants.Zero)
            ? formatAndRoundBigNumber(butterStaking.apy.add(parseUnits(String(butterAPY))), token?.decimals) + "%"
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
          token && totalSupply && token?.price.gt(constants.Zero)
            ? `$${formatAndRoundBigNumber(totalSupply.mul(token.price).div(parseEther("1")), token.decimals)}`
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
