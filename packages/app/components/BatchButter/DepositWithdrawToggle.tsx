import { Dispatch } from 'react';

interface DepositWithdrawToggleProps {
  withdrawal: Boolean;
  setwithdrawal: Dispatch<Boolean>;
}

const DepositWithdrawToggle: React.FC<DepositWithdrawToggleProps> = ({
  withdrawal,
  setwithdrawal,
}) => {
  return (
    <div className="flex flex-row">
      <div
        className={`w-1/2 ${
          withdrawal
            ? 'border-b border-gray-400 cursor-pointer group hover:border-gray-600'
            : 'border-b-2 border-gray-900'
        }`}
        onClick={(e) => setwithdrawal(false)}
      >
        <p
          className={`text-center text-base mb-4 ${
            withdrawal
              ? 'text-gray-400 group-hover:text-gray-600'
              : 'text-gray-900 font-semibold'
          }`}
        >
          Deposit
        </p>
      </div>
      <div
        className={`w-1/2 ${
          withdrawal
            ? 'border-b-2 border-gray-900'
            : 'border-b border-gray-400 cursor-pointer group hover:border-gray-600'
        }`}
        onClick={(e) => setwithdrawal(true)}
      >
        <p
          className={`text-center text-base mb-4 ${
            withdrawal
              ? 'text-gray-900 font-semibold'
              : 'text-gray-400 group-hover:text-gray-600'
          }`}
        >
          Withdraw
        </p>
      </div>
    </div>
  );
};
export default DepositWithdrawToggle;
