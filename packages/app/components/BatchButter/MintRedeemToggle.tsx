import { localStringOptions } from "@popcorn/utils";
import { InfoIconWithTooltip } from "components/InfoIconWithTooltip";
import { Dispatch } from "react";

interface MintRedeemToggleProps {
  redeeming: Boolean;
  setRedeeming: Dispatch<Boolean>;
  isThreeX?: Boolean;
}

const MintRedeemToggle: React.FC<MintRedeemToggleProps> = ({ redeeming, setRedeeming, isThreeX = false }) => {
  const displayInputToken = isThreeX ? "USDC" : "3CRV";
  const displayOutputToken = isThreeX ? "3X" : "BTR";

  return (
    <div className="flex flex-row">
      <div
        className={`w-1/2 ${
          redeeming
            ? "border-b border-gray-400 cursor-pointer group hover:border-gray-800"
            : "border-b-2 border-blue-600"
        }`}
        onClick={(e) => setRedeeming(false)}
      >
        <p
          className={`text-center mt-1 leading-none text-base mb-4 md:mb-1 ${
            redeeming ? "text-gray-400 font-semibold group-hover:text-gray-800" : "text-blue-600 font-semibold"
          }`}
        >
          Mint
          <div className="hidden md:inline">
            <InfoIconWithTooltip
              classExtras="h-7 w-7 mt-0 ml-5"
              id="1"
              title="Mint"
              content={`Mint ${displayOutputToken} with ${displayInputToken} or stablecoins to earn interest on multiple stablecoins at once.
              As the value of the underlying assets increase, so does the redeemable value of
              ${displayOutputToken}. This process converts deposited funds into other stablecoins and deploys
              them to automated yield-farming contracts by Yearn to generate interest.`}
            />
          </div>
        </p>
      </div>
      <div
        className={`w-1/2 ${
          redeeming
            ? "border-b-2 border-blue-600"
            : "border-b border-gray-400 cursor-pointer group hover:border-gray-800"
        }`}
        onClick={(e) => setRedeeming(true)}
      >
        <p
          className={`text-center mt-1 leading-none text-base mb-4 md:mb-1 ${
            redeeming ? "text-blue-600 font-semibold" : "text-gray-400 font-semibold group-hover:text-gray-800"
          }`}
        >
          Redeem
          <div className="hidden md:inline">
            <InfoIconWithTooltip
              classExtras="h-7 w-7 mt-0 ml-5"
              id="2"
              title="Redeem"
              content={`Redeem your ${displayOutputToken} to receive its value in ${displayInputToken} or stablecoins. The underlying tokens will be converted into ${displayInputToken} or your desired stablecoin. Redemptions incur a ${(0.5).toLocaleString(
                undefined,
                localStringOptions,
              )}% (50 bps) redemption fee.`}
            />
          </div>
        </p>
      </div>
    </div>
  );
};
export default MintRedeemToggle;
