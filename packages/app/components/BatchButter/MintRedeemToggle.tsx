import { Dispatch } from 'react';

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
        className={`w-1/2 ${
          redeeming
            ? 'border-b border-gray-400 cursor-pointer group hover:border-gray-800'
            : 'border-b-2 border-blue-600'
        }`}
        onClick={(e) => setRedeeming(false)}
      >
        <p
          className={`text-center mt-2 leading-none text-base mb-4 ${
            redeeming
              ? 'text-gray-400 font-semibold group-hover:text-gray-800'
              : 'text-blue-600 font-semibold'
          }`}
        >
          Mint
        </p>
      </div>
      <div
        className={`w-1/2 ${
          redeeming
            ? 'border-b-2 border-blue-600'
            : 'border-b border-gray-400 cursor-pointer group hover:border-gray-800'
        }`}
        onClick={(e) => setRedeeming(true)}
      >
        <p
          className={`text-center mt-2 leading-none text-base mb-4 ${
            redeeming
              ? 'text-blue-600 font-semibold'
              : 'text-gray-400 font-semibold group-hover:text-gray-800'
          }`}
        >
          Redeem
        </p>
      </div>
    </div>
  );
};
export default MintRedeemToggle;
