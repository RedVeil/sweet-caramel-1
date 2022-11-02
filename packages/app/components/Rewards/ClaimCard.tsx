import { PopLocker, Staking } from "@popcorn/hardhat/typechain";
import MainActionButton from "@popcorn/app/components/MainActionButton";
import TokenIcon from "@popcorn/app/components/TokenIcon";
import { BigNumber } from "ethers";
import { ChainId, formatAndRoundBigNumber } from "@popcorn/utils";
import { useContractMetadata } from "@popcorn/app/hooks/useContractMetadata";

interface ClaimCardProps {
  disabled: boolean;
  tokenAddress: string;
  tokenName: string;
  claimAmount: BigNumber;
  handler: (pool: Staking | PopLocker, isPopLocker: boolean) => void;
  pool: Staking | PopLocker;
  isPopLocker?;
  chainId: ChainId;
}

const ClaimCard: React.FC<ClaimCardProps> = ({
  disabled,
  tokenName,
  tokenAddress,
  claimAmount,
  handler,
  pool,
  isPopLocker = false,
  chainId,
}) => {
  const metadata = useContractMetadata(tokenAddress, chainId);
  return (
    <div
      className={`hover:scale-102 transition duration-500 ease-in-out transform flex flex-col md:flex-row justify-between py-6 md:px-8 w-full md:h-48 border-b border-customLightGray`}
    >
      <div className="flex flex-col justify-between">
        <div className="flex flex-row items-center">
          <div>
            <TokenIcon token={tokenAddress} chainId={chainId} fullsize />
          </div>
          <h1
            className={`text-2xl md:text-4xl leading-7 md:leading-12 mt-1 ml-4 text-black line-clamp-2 overflow-hidden`}
          >
            {metadata?.name ? metadata.name : tokenName}
          </h1>
        </div>
        <div className="my-6 md:my-0">
          <p className="text-primaryLight leading-6">Rewards</p>
          <h1 className={`text-2xl md:text-3xl leading-8 text-primary`}>
            {formatAndRoundBigNumber(claimAmount, 18)} <span className=" text-tokenTextGray text-xl"> POP</span>
          </h1>
        </div>
      </div>
      <div>
        <MainActionButton
          handleClick={() => {
            handler(pool, isPopLocker);
          }}
          label="Claim"
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default ClaimCard;
