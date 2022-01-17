import { BigNumber } from 'ethers';
import { Dispatch } from 'react';
import { BatchType } from '../../../hardhat/lib/adapters';
import MainActionButton from '../MainActionButton';
import MintRedeemToggle from './MintRedeemToggle';
import SlippageSettings from './SlippageSettings';
import TokenInput, { TokenInputProps } from './TokenInput';
interface MintRedeemInterfaceProps extends TokenInputProps {
  deposit: (depositAmount: BigNumber, batchType: BatchType) => Promise<void>;
  approve: (contractKey: string) => Promise<void>;
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
  approve,
  depositDisabled,
  useUnclaimedDeposits,
  setUseUnclaimedDeposits,
  slippage,
  setSlippage,
}) => {
  return (
    <div className="bg-white rounded-3xl px-5 pt-3.5 pb-10 mr-8 border border-gray-200 shadow-custom">
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
      <div className="h-6 mt-3 w-full">
        {!redeeming && (
          <SlippageSettings slippage={slippage} setSlippage={setSlippage} />
        )}
      </div>
      <div className="w-full text-center lg:mt-18 lglaptop:mt-20 xl:mt-28 2xl:mt-24 smlaptop:mb-1 lglaptop:mb-1 xl:mb-3.5 2xl:mb-1.5">
        {depositAmount.gt(selectedToken.input.allowance) ? (
          <MainActionButton
            label={`Approve ${selectedToken.input.name}`}
            handleClick={(e) => approve(selectedToken.input.key)}
            disabled={depositDisabled}
          />
        ) : (
          <MainActionButton
            label={redeeming ? 'Redeem' : 'Mint'}
            handleClick={(e) =>
              deposit(
                depositAmount,
                redeeming ? BatchType.Redeem : BatchType.Mint,
              )
            }
            disabled={depositDisabled}
          />
        )}
      </div>
    </div>
  );
};
export default MintRedeemInterface;
