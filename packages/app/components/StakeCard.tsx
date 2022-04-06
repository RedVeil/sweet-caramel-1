import { formatAndRoundBigNumber } from "@popcorn/utils";
import { Address, StakingPool, Token } from "@popcorn/utils/src/types";
import { constants } from "ethers/lib/ethers";
import { getSanitizedTokenDisplayName } from "helper/displayHelper";
import { formatStakedAmount } from "helper/formatStakedAmount";
import StatusWithLabel from "./Common/StatusWithLabel";
import MainActionButton from "./MainActionButton";
import TokenIcon from "./TokenIcon";

interface StakeCardProps {
  stakingPool: StakingPool;
  stakedToken: Token;
  onSelectPool: (stakingContractAddress: Address, stakingTokenAddress: Address) => void;
}

const StakeCard: React.FC<StakeCardProps> = ({ stakingPool, stakedToken, onSelectPool }) => {
  return (
    <div
      className="card p-6 md:p-8"
      onClick={async () => await onSelectPool(stakingPool?.address, stakedToken?.address)}
    >
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center">
          <TokenIcon token={getSanitizedTokenDisplayName(stakedToken?.name)} />
          <h3 className="secondary-title ml-4 ">{getSanitizedTokenDisplayName(stakedToken?.name)}</h3>
        </div>
        <div className="w-24 flex-shrink-0">
          <MainActionButton
            label="Stake"
            handleClick={async () => await onSelectPool(stakingPool?.address, stakedToken?.address)}
          />
        </div>
      </div>
      <div className="flex flex-row flex-wrap items-center mt-6 justify-between">
        <div className="w-1/2 md:w-1/4 mt-4">
          <StatusWithLabel
            content={
              stakingPool.apy.lt(constants.Zero) ? "New 🍿✨" : formatAndRoundBigNumber(stakingPool.apy, 2) + "%"
            }
            label="Est. APY"
            green
          />
        </div>
        <div className="w-1/2 md:w-1/4 mt-4">
          <StatusWithLabel content={formatStakedAmount(stakingPool.totalStake)} label="Total Staked" />
        </div>
        <div className="w-full md:w-1/2 mt-4">
          <StatusWithLabel
            content={`${formatAndRoundBigNumber(stakingPool.tokenEmission, 3)} POP / day`}
            label="Token Emissions"
          />
        </div>
      </div>
    </div>
  );
};

export default StakeCard;
