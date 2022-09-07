import { formatAndRoundBigNumber } from "@popcorn/utils";
import { Address, StakingPool, Token } from "@popcorn/utils/src/types";
import { constants } from "ethers";
import { getSanitizedTokenDisplayName } from "helper/displayHelper";
import useTokenPrice from "hooks/useTokenPrice";
import Badge, { Badge as BadgeType } from "./Common/Badge";
import StatusWithLabel from "./Common/StatusWithLabel";
import MainActionButton from "./MainActionButton";
import TokenIcon from "./TokenIcon";

interface StakeCardProps {
  stakingPool: StakingPool;
  stakedToken: Token;
  onSelectPool: (stakingContractAddress: Address, stakingTokenAddress: Address) => void;
  badge?: BadgeType;
}

const StakeCard: React.FC<StakeCardProps> = ({ stakingPool, stakedToken, onSelectPool, badge }) => {
  const tokenPrice = useTokenPrice(stakedToken?.address);
  return (
    <div className="card p-6 md:p-8" onClick={async () => onSelectPool(stakingPool?.address, stakedToken?.address)}>
      {badge && (
        <div className="absolute -top-4 w-full">
          <Badge badge={badge} />
        </div>
      )}
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center">
          <TokenIcon token={getSanitizedTokenDisplayName(stakedToken?.name)} fullsize />
          <h3 className="secondary-title ml-4 ">{getSanitizedTokenDisplayName(stakedToken?.name)}</h3>
        </div>
        <div className="w-24 hidden smmd:block flex-shrink-0 ">
          <MainActionButton
            label="Stake"
            handleClick={async () => onSelectPool(stakingPool?.address, stakedToken?.address)}
          />
        </div>
      </div>
      <div className="flex flex-row flex-wrap items-center mt-6 justify-between">
        <div className="w-1/2 md:w-1/4 mt-4">
          <StatusWithLabel
            content={
              stakingPool.apy.lt(constants.Zero) ? "New 🍿✨" : formatAndRoundBigNumber(stakingPool.apy, stakedToken.decimals) + "%"
            }
            label={
              <>
                <span className="lowercase">v</span>APR
              </>
            }
            green
            infoIconProps={{
              id: "vAPR",
              title: "vAPR",
              content: "This is a variable annual percentage rate. 90% of POP rewards are vested over one year.",
            }}
          />
        </div>
        <div className="w-1/2 md:w-1/4 mt-4">
          <StatusWithLabel
            content={tokenPrice ? `$ ${formatAndRoundBigNumber(stakingPool?.totalStake?.mul(tokenPrice).div(constants.WeiPerEther), stakedToken?.decimals)}` : "..."}
            label="TVL"
          />
        </div>
        <div className="w-full md:w-1/2 mt-4">
          <StatusWithLabel
            content={`${formatAndRoundBigNumber(stakingPool.tokenEmission, stakedToken.decimals)} POP / day`}
            label="TOKEN EMISSIONS"
          />
        </div>
      </div>
      <div className="w-full mt-10 smmd:hidden">
        <MainActionButton
          label="Stake"
          handleClick={async () => onSelectPool(stakingPool?.address, stakedToken?.address)}
        />
      </div>
    </div>
  );
};

export default StakeCard;
