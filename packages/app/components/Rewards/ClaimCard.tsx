import { PopLocker, Staking } from "@popcorn/hardhat/typechain";
import { formatAndRoundBigNumber } from "@popcorn/utils";
import MainActionButton from "components/MainActionButton";
import TokenIcon from "components/TokenIcon";
import { BigNumber } from "ethers";
import { getSanitizedTokenDisplayName } from "helper/displayHelper";
interface ClaimCardProps {
  disabled: boolean;
  tokenName: string;
  claimAmount: BigNumber;
  handler: (pool: Staking | PopLocker, isPopLocker: boolean) => void;
  pool: Staking | PopLocker;
  isPopLocker?;
}

const ClaimCard: React.FC<ClaimCardProps> = ({
  disabled,
  tokenName,
  claimAmount,
  handler,
  pool,
  isPopLocker = false,
}) => {
  return (
    <div
      className={`flex flex-col md:flex-row justify-between py-6 md:px-8 w-full md:h-48 border-b border-customLightGray`}
    >
      <div className="flex flex-col justify-between">
        <div className="flex flex-row items-center">
          <div>
            <TokenIcon token={tokenName} fullsize />
          </div>
          <h1 className={`uppercase text-2xl md:text-4xl leading-10 mt-1 ml-4 text-black line-clamp-2 overflow-hidden`}>
            {getSanitizedTokenDisplayName(tokenName)}
          </h1>
        </div>
        <div className="my-6 md:my-0">
          <p className="text-primaryLight leading-6">Rewards</p>
          <h1 className={`text-2xl md:text-3xl leading-8 text-primary`}>
            {formatAndRoundBigNumber(claimAmount, 3)} <span className=" text-tokenTextGray text-xl"> POP</span>
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
