import { CheckCircleIcon } from '@heroicons/react/outline';
import React from 'react';

interface ClaimCardProps {
  amount: number;
  disabled: boolean;
  Icon: (props: React.ComponentProps<'svg'>) => JSX.Element;
  iconCol: string;
  percent: number;
  type: 'Staking' | 'Participation Rewards' | 'Rewards Escrow';
  token: string;
}

export const ClaimCard: React.FC<ClaimCardProps> = ({
  amount,
  disabled,
  Icon,
  iconCol = 'bg-pink-500',
  percent,
  type,
  token,
}) => {
  return (
    <div className="bg-gray-50 rounded-lg shadow px-5 py-6 flex flex-col max-w-sm">
      <div className="bg-white rounded-xl border border-w-0.5 px-5 py-6 flex flex-row mb-3">
        <div
          className={`${
            disabled ? 'bg-gray-400' : iconCol
          } mt-2 text-white rounded-full h-10 w-10 flex items-center justify-center`}
        >
          <Icon className="h-6 w-6" aria-hidden="true"></Icon>
        </div>
        <div className="flex flex-col ml-5">
          <p className="text-md font-semibold text-gray-500">{type}</p>
          <p className="text-2xl text-gray-900">
            {token} {amount}
          </p>
        </div>
      </div>
      <span
        className={`inline-flex w-32 my-4 pl-3 pr-5 py-2 rounded-full text-sm font-medium text-white ${
          disabled ? 'bg-gray-400' : 'bg-green-500'
        }`}
      >
        <CheckCircleIcon className="h-5 w-5 mr-3" />
        Claimable
      </span>
      <p className="text-md text-gray-500 mb-2 font-semibold">APR</p>
      <p className="text-md mb-4">{percent}%</p>

      <button
        className={`w-full text-center mt-50  px-12 py-3 text-white rounded-xl disabled:opacity-75 ${
          disabled ? 'hover:bg-blue-700 bg-gray-400' : 'bg-blue-600'
        }`}
        onClick={(e) => console.log(`Handle ${type} claim`)}
        disabled={disabled}
      >
        Claim
      </button>
    </div>
  );
};
