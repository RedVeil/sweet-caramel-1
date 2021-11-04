import { BigNumber } from '@ethersproject/bignumber';
import { BatchType } from '../../../hardhat/lib/adapters';
import DepositWithdrawToggle from './DepositWithdrawToggle';
import TokenInput, { TokenInputProps } from './TokenInput';

interface MintRedeemInterfaceProps extends TokenInputProps {
  deposit: (depositAmount: BigNumber, batchType: BatchType) => Promise<void>;
  depositDisabled: boolean;
}

const MintRedeemInterface: React.FC<MintRedeemInterfaceProps> = ({
  threeCrvBalance,
  threeCrvPrice,
  hysiBalance,
  hysiPrice,
  withdrawal,
  setwithdrawal,
  depositAmount,
  setDepositAmount,
  deposit,
  depositDisabled,
  useUnclaimedDeposits,
  setUseUnclaimedDeposits,
}) => {
  return (
    <div className="bg-white rounded-lg px-5 py-6 mr-8 border border-gray-300">
      <DepositWithdrawToggle
        withdrawal={withdrawal}
        setwithdrawal={setwithdrawal}
      />
      <TokenInput
        threeCrvBalance={threeCrvBalance}
        threeCrvPrice={threeCrvPrice}
        hysiBalance={hysiBalance}
        hysiPrice={hysiPrice}
        withdrawal={withdrawal}
        setwithdrawal={setwithdrawal}
        depositAmount={depositAmount}
        setDepositAmount={setDepositAmount}
        useUnclaimedDeposits={useUnclaimedDeposits}
        setUseUnclaimedDeposits={setUseUnclaimedDeposits}
      />
      <div className="w-full text-center mt-8">
        <button
          className={`bg-blue-600 px-12 py-3 text-white rounded-xl disabled:opacity-75 ${
            depositDisabled ? 'hover:bg-blue-700' : ''
          }`}
          onClick={(e) =>
            deposit(
              depositAmount,
              withdrawal ? BatchType.Redeem : BatchType.Mint,
            )
          }
          disabled={depositDisabled}
        >
          Deposit
        </button>
      </div>
    </div>
  );
};
export default MintRedeemInterface;
