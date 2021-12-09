import { BigNumber } from 'ethers';
import { Dispatch } from 'react';
import { BatchType } from '../../../hardhat/lib/adapters';
import MintRedeemToggle from './MintRedeemToggle';
import SlippageSettings from './SlippageSettings';
import TokenInput, { TokenInputProps } from './TokenInput';
interface MintRedeemInterfaceProps extends TokenInputProps {
  deposit: (depositAmount: BigNumber, batchType: BatchType) => Promise<void>;
  slippage: number;
  setSlippage: Dispatch<number>;
}

const MintRedeemInterface: React.FC<MintRedeemInterfaceProps> = ({
  token,
  selectedToken,
  selectToken,
  redeeming,
  setRedeeming,
  depositAmount,
  setDepositAmount,
  deposit,
  depositDisabled,
  useUnclaimedDeposits,
  setUseUnclaimedDeposits,
  slippage,
  setSlippage,
}) => {
  return (
    <div className="bg-white rounded-3xl px-5 py-6 mr-8 border border-gray-300">
      <MintRedeemToggle redeeming={redeeming} setRedeeming={setRedeeming} />
      <TokenInput
        token={token}
        selectedToken={selectedToken}
        selectToken={selectToken}
        redeeming={redeeming}
        setRedeeming={setRedeeming}
        depositAmount={depositAmount}
        setDepositAmount={setDepositAmount}
        useUnclaimedDeposits={useUnclaimedDeposits}
        setUseUnclaimedDeposits={setUseUnclaimedDeposits}
        depositDisabled={depositDisabled}
      />
      <div>
        <SlippageSettings slippage={slippage} setSlippage={setSlippage} />
      </div>
      <div className="w-full text-center mt-6">
        <button
          className={`bg-blue-600 px-24 py-3 text-white rounded-full disabled:bg-gray-300 ${
            depositDisabled ? '' : 'hover:bg-blue-700'
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
