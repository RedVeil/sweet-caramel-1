import { BigNumber } from '@ethersproject/bignumber';
import { BatchType } from '../../../hardhat/lib/adapters';
import MintRedeemToggle from './MintRedeemToggle';
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
  redeeming,
  setRedeeming,
  depositAmount,
  setDepositAmount,
  deposit,
  depositDisabled,
  useUnclaimedDeposits,
  setUseUnclaimedDeposits,
}) => {
  return (
    <div className="bg-white rounded-lg px-5 py-6 mr-8 border border-gray-300">
      <MintRedeemToggle redeeming={redeeming} setRedeeming={setRedeeming} />
      <TokenInput
        threeCrvBalance={threeCrvBalance}
        threeCrvPrice={threeCrvPrice}
        hysiBalance={hysiBalance}
        hysiPrice={hysiPrice}
        redeeming={redeeming}
        setRedeeming={setRedeeming}
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
              redeeming ? BatchType.Redeem : BatchType.Mint,
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
