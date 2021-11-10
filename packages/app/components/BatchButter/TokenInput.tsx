import { BigNumber } from '@ethersproject/bignumber';
import { BatchProcessTokens, SelectedToken } from 'pages/butter';
import { Dispatch, useEffect, useState } from 'react';
import { bigNumberToNumber, scaleNumberToBigNumber } from '../../../utils';

export interface BatchProcessToken {
  name: string;
  balance: BigNumber;
  claimableBalance?: BigNumber;
  price: BigNumber;
}

export interface TokenInputProps {
  token: BatchProcessTokens;
  selectedToken: SelectedToken;
  selectToken: Function;
  redeeming: Boolean;
  setRedeeming: Dispatch<Boolean>;
  depositAmount: BigNumber;
  setDepositAmount: Dispatch<BigNumber>;
  useUnclaimedDeposits: Boolean;
  setUseUnclaimedDeposits: Dispatch<Boolean>;
}

const TokenInput: React.FC<TokenInputProps> = ({
  token,
  selectedToken,
  selectToken,
  redeeming,
  setRedeeming,
  depositAmount,
  setDepositAmount,
  useUnclaimedDeposits,
  setUseUnclaimedDeposits,
}) => {
  const [estimatedAmount, setEstimatedAmount] = useState<number>(0);
  const [validInputAmount, setValidInputAmount] = useState<Boolean>(true);

  useEffect(() => {
    if (depositAmount.toString() !== '0') {
      calcOutputAmountsFromInput(depositAmount);
    }
  }, []);

  useEffect(() => {
    setValidInputAmount(depositAmount <= selectedToken.input.balance);
  }, [depositAmount]);

  function updateWithOuputAmounts(value: number): void {
    setEstimatedAmount(value);
    setDepositAmount(
      scaleNumberToBigNumber(value)
        .mul(selectedToken.output.price)
        .div(selectedToken.input.price),
    );
  }

  function updateWithInputAmounts(value: number): void {
    const raisedValue = scaleNumberToBigNumber(value);
    setDepositAmount(raisedValue);
    calcOutputAmountsFromInput(raisedValue);
  }

  function calcOutputAmountsFromInput(value: BigNumber): void {
    setEstimatedAmount(
      bigNumberToNumber(
        value.mul(selectedToken.input.price).div(selectedToken.output.price),
      ),
    );
  }

  return (
    <>
      <div className="mt-6">
        <p className="font-semibold text-sm text-gray-900 mb-1">
          Deposit Amount
        </p>
        <div
          className={`rounded-md border  px-2 py-3 ${
            validInputAmount ? 'border-gray-200' : 'border-red-600'
          }`}
        >
          <div className="flex flex-row justify-between items-center">
            <input
              className="w-96"
              placeholder="-"
              value={bigNumberToNumber(depositAmount)}
              onChange={(e) => updateWithInputAmounts(Number(e.target.value))}
            />
            <div className="flex flex-row items-center">
              <p
                className="text-gray-400 mr-3 border border-gray-400 p-1 rounded cursor-pointer hover:bg-gray-50 hover:border-gray-500 hover:text-gray-600"
                onClick={(e) => {
                  setDepositAmount(
                    useUnclaimedDeposits
                      ? selectedToken.input.claimableBalance
                      : selectedToken.input.balance,
                  );
                  calcOutputAmountsFromInput(
                    useUnclaimedDeposits
                      ? selectedToken.input.claimableBalance
                      : selectedToken.input.balance,
                  );
                }}
              >
                MAX
              </p>
              <p className="text-gray-700">{selectedToken.input.name}</p>
            </div>
          </div>
        </div>
        <label className="flex flex-row items-center mt-2">
          <input
            type="checkbox"
            className="mr-2 rounded-sm"
            onChange={(e) => setUseUnclaimedDeposits(!useUnclaimedDeposits)}
          />
          <p>Use unclaimed Balances</p>
        </label>

        {!validInputAmount && (
          <p className="text-red-600">Insufficient Balance</p>
        )}
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center my-6">
          <div className="w-16 bg-white">
            <div
              className="flex mx-auto w-10 h-10 rounded-full border border-gray-200 items-center cursor-pointer hover:bg-gray-50 hover:border-gray-400"
              onClick={(e) => setRedeeming(!redeeming)}
            >
              <img
                src="/images/icons/exchangeIcon.svg"
                alt="exchangeIcon"
                className="mx-auto p-3"
              ></img>
            </div>
          </div>
        </div>
      </div>
      <div className="">
        <p className="font-semibold text-sm text-gray-900 mb-1">
          {`Estimated ${selectedToken.output.name} Amount`}
        </p>
        <div className="rounded-md border border-gray-200 px-2 py-4">
          <div className="flex flex-row justify-between">
            <input
              className="w-96"
              placeholder="-"
              value={estimatedAmount}
              onChange={(e) => updateWithOuputAmounts(Number(e.target.value))}
            />
            <p className="text-gray-700">{selectedToken.output.name}</p>
          </div>
        </div>
      </div>
    </>
  );
};
export default TokenInput;
