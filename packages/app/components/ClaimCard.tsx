import router from 'next/router';
import * as Icon from 'react-feather';
import MainActionButton from './MainActionButton';
import TokenIcon from './TokenIcon';
interface ClaimCardProps {
  tokenName: string;
  claimable: number;
  handleClick: Function;
}

const ClaimCard: React.FC<ClaimCardProps> = ({
  tokenName,
  claimable,
  handleClick,
}) => {
  return (
    <div
      className={`w-full rounded-3xl border border-gray-200 shadow-custom p-8 ${
        claimable === 0 ? 'bg-gray-100' : 'bg-white'
      }`}
    >
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center">
          <div className={claimable === 0 ? 'opacity-50' : 'opacity-100'}>
            <TokenIcon token={tokenName} />
          </div>
          <h1
            className={`text-2xl font-medium ml-4 ${
              claimable === 0 ? 'text-gray-400' : 'text-gray-800'
            }`}
          >
            {tokenName} Staking
          </h1>
        </div>
        <div className="w-24">
          <MainActionButton
            label="Claim"
            handleClick={handleClick}
            disabled={claimable === 0}
          />
        </div>
      </div>
      <p
        className={`font-light uppercase mt-10 pt-1 ${
          claimable === 0 ? 'text-gray-400 ' : 'text-gray-500 '
        }`}
      >
        Your Rewards
      </p>
      <div className="flex flex-row items-end justify-between mt-1">
        <p
          className={`text-xl font-medium ${
            claimable === 0 ? 'text-gray-400 ' : 'text-gray-800 '
          }`}
        >
          {claimable.toLocaleString()} POP
        </p>
        <a
          className={`cursor-pointer flex flex-row items-center  group ${
            claimable === 0
              ? 'text-gray-400'
              : 'text-blue-800 hover:text-blue-600'
          }`}
          onClick={() => {
            handleClick();
            router.push('/staking/pop');
          }}
        >
          Restake to earn even more
          <Icon.ArrowRightCircle
            className={`ml-3 ${
              claimable === 0 ? '' : 'group-hover:text-blue-600'
            }`}
          />
        </a>
      </div>
    </div>
  );
};
export default ClaimCard;
