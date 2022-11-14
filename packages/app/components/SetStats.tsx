import StatusWithLabel from "@popcorn/app/components/Common/StatusWithLabel";
import useGetYearnAPY from "@popcorn/app/hooks/set/useGetYearnAPY";
import useSetComponentAddresses from "@popcorn/app/hooks/set/useSetComponentAddresses";
import useStakingPool from "@popcorn/app/hooks/staking/useStakingPool";
import useTotalTokenSupply from "@popcorn/app/hooks/tokens/useTotalTokenSupply";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import { ChainId, formatAndRoundBigNumber, localStringOptions } from "@popcorn/utils";
import { Token } from "@popcorn/utils/types";
import { constants } from "ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";

export interface SetStatsProps {
  token: Token;
}

export default function SetStats({ token }: SetStatsProps) {
  const SocialImpactInfoProps = {
    content:
      "Approximately one-third of all fees collected by Popcorn are donated to social impact and non-profit organizations selected by POP token holders.",
    id: "socialImpact",
    title: "Social Impact",
  };

  const {
    threeX,
    threeXStaking: threeXStakingAddress,
    butterStaking: butterStakingAddress,
  } = useDeployment(ChainId.Ethereum);
  const yearnAddresses = useSetComponentAddresses(token?.address);
  const { data: butterAPY } = useGetYearnAPY(yearnAddresses, ChainId.Ethereum);
  const { data: butterStaking } = useStakingPool(
    token?.address === threeX ? threeXStakingAddress : butterStakingAddress,
    ChainId.Ethereum,
  );
  const tokenSupply = useTotalTokenSupply(token?.address, ChainId.Ethereum);

  const apyInfoText = `This is the variable annual percentage rate. The shown vAPR comes from yield on the underlying stablecoins (${
    butterAPY ? butterAPY.toLocaleString(undefined, localStringOptions) : "-"
  }%) and is boosted with POP (${
    butterStaking ? formatAndRoundBigNumber(butterStaking.apy, token?.decimals) : "-"
  }%). You must stake your ${
    token?.symbol
  } to receive the additional vAPR in POP. 90% of earned POP rewards are vested over one year.`;

  return (
    <div className="flex flex-row flex-wrap items-start md:items-center mt-8 gap-8 md:gap-0 md:space-x-6">
      <StatusWithLabel
        content={
          butterStaking?.apy?.add(parseUnits(String(butterAPY || 0))).gte(constants.Zero)
            ? formatAndRoundBigNumber(butterStaking.apy.add(parseUnits(String(butterAPY || 0))), token?.decimals) + "%"
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
          token && tokenSupply && token?.price.gt(constants.Zero)
            ? `$${formatAndRoundBigNumber(tokenSupply.mul(token.price).div(parseEther("1")), token.decimals)}`
            : "$ ..."
        }
        label="Total Deposits"
      />
      <div className="bg-gray-300 h-16 hidden md:block" style={{ width: "1px" }}></div>

      <>
        {token?.address === threeX ? (
          <StatusWithLabel content={"$1m"} label="TVL Limit" />
        ) : (
          <StatusWithLabel content={`Coming Soon`} label="Social Impact" infoIconProps={SocialImpactInfoProps} />
        )}
      </>
    </div>
  );
}
