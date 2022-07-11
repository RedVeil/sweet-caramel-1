import { PopLocker, Staking } from "@popcorn/hardhat/typechain";
import { formatAndRoundBigNumber } from "@popcorn/utils";
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
      className={`hover:scale-102 transition duration-500 ease-in-out transform flex flex-col md:flex-row items-center justify-between py-6 px-8 w-full md:h-48 mb-8 shadow-custom rounded-3xl border border-gray-200 ${
        disabled ? "bg-gray-50" : "bg-cardBg"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between md:mt-2 md:my-auto w-full">
        <div className="flex flex-row items-center my-auto mb-6 md:mb-4 justify-center md:justify-start">
          <div className={disabled ? "opacity-50" : "opacity-100"}>
            <TokenIcon token={tokenName} fullsize />
          </div>
          <h1
            className={`uppercase text-xl md:text-3xl font-medium leading-none text-baseline mt-1 ml-4 ${
              disabled ? "text-gray-400" : "text-gray-900"
            }`}
          >
            {getSanitizedTokenDisplayName(tokenName)}
          </h1>
        </div>
        <h1
          className={`text-2xl md:text-3xl font-semibold md:font-medium leading-none mr-8 mt-1 mb-6 md:mb-4 text-center md:text-left ${
            disabled ? "text-gray-400" : "text-gray-500 md:text-gray-900"
          }`}
        >
          {formatAndRoundBigNumber(claimAmount, 3)} POP
        </h1>
      </div>
      <button
        onClick={() => {
          handler(pool, isPopLocker);
        }}
        disabled={disabled}
        className="w-full md:w-28 bg-blue-600 rounded-full flex-shrink-0 justify-self-center py-3 leading-none cursor-pointer hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-default"
      >
        <p className="font-medium text-lg text-white">Claim</p>
      </button>
    </div>
  );
};

export default ClaimCard;
