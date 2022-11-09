import { ChainId, formatAndRoundBigNumber, networkLogos, networkMap } from "@popcorn/utils";
import { constants } from "ethers";
import useTokenPrice from "@popcorn/app/hooks/useTokenPrice";
import { useContractMetadata } from "@popcorn/app/hooks/useContractMetadata";
import Badge, { Badge as BadgeType } from "@popcorn/app/components/Common/Badge";
import MainActionButton from "@popcorn/app/components/MainActionButton";
import TokenIcon from "@popcorn/app/components/TokenIcon";
import useStakingPool from "@popcorn/app/hooks/staking/useStakingPool";
import usePopLocker from "@popcorn/app/hooks/staking/usePopLocker";
import { StakingType } from "hooks/staking/useAllStakingContracts";
import { useRouter } from "next/router";

interface StakeCardProps {
  stakingAddress: string;
  stakingType: StakingType;
  chainId: ChainId;
  badge?: BadgeType;
}

const StakeCard: React.FC<StakeCardProps> = ({ stakingAddress, stakingType, chainId, badge }) => {
  const router = useRouter();

  // Fetch either popLocker or stakingPool
  const { data: popLocker, isValidating: popLockerIsValidating, error: popLockerError } = usePopLocker(stakingAddress, stakingType === StakingType.PopLocker ? ChainId.Ethereum : undefined);
  const { data: stakingPool, isValidating: stakingPoolIsValidating, error: stakingPoolError } = useStakingPool(
    stakingAddress,
    stakingType === StakingType.StakingPool ? ChainId.Ethereum : undefined
  );
  const staking = stakingType === StakingType.PopLocker ? popLocker : stakingPool;

  // Not in use yet (For future optimizations)
  const isValidating = stakingType === StakingType.PopLocker ? popLockerIsValidating : stakingPoolIsValidating;
  const error = stakingType === StakingType.PopLocker ? popLockerError : stakingPoolError;

  const tokenPrice = useTokenPrice(staking?.stakingToken?.address, chainId);
  const metadata = useContractMetadata(staking?.stakingToken?.address, chainId);

  function onSelectPool() {
    router?.push(`/${networkMap[chainId]?.toLowerCase()}/staking/${stakingType === StakingType.PopLocker ? "pop" : stakingAddress}`)
  }

  return (
    <div
      className={`border-b border-b-customLightGray cursor-pointer hover:scale-102 transition duration-500 ease-in-out transform relative ${staking === undefined ? "hidden" : ""}`}
      onClick={onSelectPool}
    >
      <img src={networkLogos[chainId]} alt={ChainId[chainId]} className="w-4.5 h-4 mr-4" />
      <div className="py-8 md:p-8">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center">
            <TokenIcon token={staking?.stakingToken?.address} chainId={chainId} fullsize />
            <div className="flex flex-col md:flex-row md:items-center ml-2 md:ml-0">
              <h3 className="text-3xl md:text-4xl md:ml-2 mb-2 md:mb-0 font-normal leading-9">
                {metadata?.name ? metadata.name : staking?.stakingToken?.name}
              </h3>
              {badge && (
                <div className="md:pl-2">
                  <Badge badge={badge} />
                </div>
              )}
            </div>
          </div>
          <div className="hidden smmd:block">
            <MainActionButton
              label="View"
              handleClick={onSelectPool}
            />
          </div>
        </div>
        <div className="flex flex-row flex-wrap items-center mt-0 md:mt-6 justify-between">
          <div className="w-1/2 md:w-1/4 mt-6 md:mt-0">
            <p className="text-primaryLight leading-6">vAPR</p>
            <p className="text-primary text-2xl md:text-3xl leading-6 md:leading-8">
              {staking?.apy.lt(constants.Zero)
                ? "New 🍿✨"
                : formatAndRoundBigNumber(staking?.apy, staking?.stakingToken?.decimals) + "%"}
            </p>
          </div>
          <div className="w-1/2 md:w-1/4 mt-6 md:mt-0">
            <p className="text-primaryLight leading-6">TVL</p>
            <p className="text-primary text-2xl md:text-3xl leading-6 md:leading-8">
              {tokenPrice
                ? `$ ${formatAndRoundBigNumber(
                  staking?.totalStake?.mul(tokenPrice).div(constants.WeiPerEther),
                  staking?.stakingToken?.decimals,
                )}`
                : "..."}
            </p>
          </div>
          <div className="w-full md:w-1/2 mt-6 md:mt-0">
            <p className="text-primaryLight leading-6">Token Emissions</p>
            <p className="text-primary text-2xl md:text-3xl leading-6 md:leading-8">
              {formatAndRoundBigNumber(staking?.tokenEmission, staking?.stakingToken?.decimals)}{" "}
              <span className=" text-tokenTextGray text-xl"> POP / day</span>
            </p>
          </div>
        </div>
        <div className="w-full mt-6 smmd:hidden">
          <MainActionButton
            label="View"
            handleClick={onSelectPool}
          />
        </div>
      </div>
    </div>
  );
};

export default StakeCard;
