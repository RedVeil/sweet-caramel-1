import { formatAndRoundBigNumber } from "@popcorn/utils";
import { Address, StakingPool, Token } from "@popcorn/utils/src/types";
import { constants } from "ethers";
import { getSanitizedTokenDisplayName } from "helper/displayHelper";
import useTokenPrice from "hooks/useTokenPrice";
import Badge, { Badge as BadgeType } from "./Common/Badge";
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
    <div
      className="border-b border-b-customLightGray py-8 md:p-8 cursor-pointer hover:scale-102 transition duration-500 ease-in-out transform relative"
      onClick={async () => onSelectPool(stakingPool?.address, stakedToken?.address)}
    >
      {badge && (
        <div className="absolute -top-4 w-full">
          <Badge badge={badge} />
        </div>
      )}
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center">
          <TokenIcon token={getSanitizedTokenDisplayName(stakedToken?.name)} fullsize />
          <h3 className="text-3xl md:text-4xl ml-2 font-normal leading-9">
            {getSanitizedTokenDisplayName(stakedToken?.name)}
          </h3>
        </div>
        <div className="hidden smmd:block">
          <MainActionButton
            label="View"
            handleClick={async () => onSelectPool(stakingPool?.address, stakedToken?.address)}
          />
        </div>
      </div>
      <div className="flex flex-row flex-wrap items-center mt-0 md:mt-6 justify-between">
        <div className="w-1/2 md:w-1/4 mt-6 md:mt-0">
          <p className="text-primaryLight leading-6">vAPR</p>
          <p className="text-primary text-2xl md:text-3xl leading-6 md:leading-8">
            {stakingPool.apy.lt(constants.Zero) ? "New 🍿✨" : formatAndRoundBigNumber(stakingPool.apy, stakedToken.decimals) + "%"}
          </p>
        </div>
        <div className="w-1/2 md:w-1/4 mt-6 md:mt-0">
          <p className="text-primaryLight leading-6">TVL</p>
          <p className="text-primary text-2xl md:text-3xl leading-6 md:leading-8">
            {tokenPrice ? `$ ${formatAndRoundBigNumber(stakingPool?.totalStake?.mul(tokenPrice).div(constants.WeiPerEther), stakedToken?.decimals)}` : "..."}
          </p>
        </div>
        <div className="w-full md:w-1/2 mt-6 md:mt-0">
          <p className="text-primaryLight leading-6">Token Emissions</p>
          <p className="text-primary text-2xl md:text-3xl leading-6 md:leading-8">
            {formatAndRoundBigNumber(stakingPool.tokenEmission, stakedToken.decimals)}{" "}
            <span className=" text-tokenTextGray text-xl"> POP / day</span>
          </p>
        </div>
      </div>
      <div className="w-full mt-6 smmd:hidden">
        <MainActionButton
          label="View"
          handleClick={async () => onSelectPool(stakingPool?.address, stakedToken?.address)}
        />
      </div>
    </div>
  );
};

export default StakeCard;
