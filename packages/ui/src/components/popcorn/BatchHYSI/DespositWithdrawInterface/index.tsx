import { BigNumber } from '@ethersproject/bignumber';
import { BatchType } from '@popcorn/contracts/adapters/HYSIBatchInteraction/HYSIBatchInteractionAdapter';
import { DepositWithdrawToggle } from '../DepositWithdrawToggle';
import TokenInput, { TokenInputProps } from '../TokenInput';

interface DespositWithdrawInterfaceProps extends TokenInputProps {
  deposit: (depositAmount: BigNumber, batchType: BatchType) => Promise<void>;
  depositDisabled: boolean;
}

export const DespositWithdrawInterface: React.FC<DespositWithdrawInterfaceProps> =
  ({
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
      <div
        className="relative mt-12 lg:-mt-12 bg-white rounded-lg shadow px-5 pt-6 sm:px-6"
        style={{ minWidth: 300 }}
      >
        <div className="flex flex-row">
          <div className="w-full px-6 py-6">
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
            <div className="w-full text-center mt-10">
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
        </div>
      </div>
    );
  };
