import { ChainId, formatAndRoundBigNumber, localStringOptions } from "@popcorn/utils";
import { Token } from "@popcorn/utils/types";
import StatusWithLabel from "@popcorn/app/components/Common/StatusWithLabel";
import { constants } from "ethers";
import { parseEther, parseUnits } from "ethers/lib/utils";
import useGetYearnAPY from "@popcorn/app/hooks/set/useGetYearnAPY";
import useStakingPool from "@popcorn/app/hooks/staking/useStakingPool";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import useSetComponentAddresses from "@popcorn/app/hooks/set/useSetComponentAddresses";
import useTotalTokenSupply from "@popcorn/app/hooks/tokens/useTotalTokenSupply";
import { useNamedAccounts } from "@popcorn/components";
import { Apy } from "@popcorn/components/pop/Staking";
import { Tvl } from "@popcorn/components/pop/Contract";

export interface SetStatsProps {
  token: Token;
  isThreeX?: boolean;
}

export default function SetStats({ token, isThreeX = false }: SetStatsProps) {
  const SocialImpactInfoProps = {
    content:
      "Approximately one-third of all fees collected by Popcorn are donated to social impact and non-profit organizations selected by POP token holders.",
    id: "socialImpact",
    title: "Social Impact",
  };

  const yearnAddresses = useSetComponentAddresses(token?.address);
  const { data: tokenAPY } = useGetYearnAPY(yearnAddresses, ChainId.Ethereum);

  const contractsEth = useNamedAccounts("1", ["threeX", "butter", "threeXStaking", "butterStaking"]);
  const { data: stakingPool } = useStakingPool(
    isThreeX ? contractsEth[2].address : contractsEth[3].address,
    ChainId.Ethereum,
  );

  const apyInfoText = `This is the variable annual percentage rate. The shown vAPR comes from yield on the underlying stablecoins (${
    tokenAPY ? tokenAPY.toLocaleString(undefined, localStringOptions) : "-"
  }%) and is boosted with POP (${
    stakingPool ? formatAndRoundBigNumber(stakingPool.apy, token?.decimals) : "-"
  }%). You must stake your ${
    token?.symbol
  } to receive the additional vAPR in POP. 90% of earned POP rewards are vested over one year.`;

  return (
    <div className="flex flex-row flex-wrap items-start md:items-center mt-8 gap-8 md:gap-0 md:space-x-6">
      <StatusWithLabel
        content={
          <Apy chainId={ChainId.Ethereum} address={isThreeX ? contractsEth[2].address : contractsEth[3].address} />
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
          <Tvl chainId={ChainId.Ethereum} address={isThreeX ? contractsEth[0].address : contractsEth[1].address} />
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
