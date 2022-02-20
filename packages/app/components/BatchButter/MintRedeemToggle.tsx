import { Dispatch } from 'react';
import { InfoIconWithTooltip } from 'components/InfoIconWithTooltip';

interface MintRedeemToggleProps {
  redeeming: Boolean;
  setRedeeming: Dispatch<Boolean>;
}

const MintRedeemToggle: React.FC<MintRedeemToggleProps> = ({
  redeeming,
  setRedeeming,
}) => {
  return (
    <div className="flex flex-row">
      <div
        className={`w-1/2 ${redeeming
          ? 'border-b border-gray-400 cursor-pointer group hover:border-gray-800'
          : 'border-b-2 border-blue-600'
          }`}
        onClick={(e) => setRedeeming(false)}
      >
        <p
          className={`text-center mt-1 leading-none text-base mb-1 ${redeeming
            ? 'text-gray-400 font-semibold group-hover:text-gray-800'
            : 'text-blue-600 font-semibold'
            }`}
        >
          Mint
          <InfoIconWithTooltip id="1" title="Mint" content="Butter is a token that represents a yield accrual strategy. The minting process involves converting deposited stablecoins into other stable assets that are compatible with the yield accrual strategy. As the value of the underlying assets increase, so does the redeemable value of Butter." />
        </p>
      </div>
      <div
        className={`w-1/2 ${redeeming
          ? 'border-b-2 border-blue-600'
          : 'border-b border-gray-400 cursor-pointer group hover:border-gray-800'
          }`}
        onClick={(e) => setRedeeming(true)}
      >
        <p
          className={`text-center mt-1 leading-none text-base mb-1 ${redeeming
            ? 'text-blue-600 font-semibold'
            : 'text-gray-400 font-semibold group-hover:text-gray-800'
            }`}
        >
          Redeem
          <InfoIconWithTooltip id="2" title="Redeem" content="The Butter redemption process involves unwrapping Butter's underlying assets into stablecoins." />
        </p>
      </div>
    </div>
  );
};
export default MintRedeemToggle;
