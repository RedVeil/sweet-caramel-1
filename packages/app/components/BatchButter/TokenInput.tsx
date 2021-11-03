import { BigNumber } from '@ethersproject/bignumber';
import { bigNumberToNumber, scaleNumberToBigNumber } from '@popcorn/utils';
import { Dispatch, useEffect, useState } from 'react';

export interface TokenInputProps {
  threeCrvBalance: BigNumber;
  threeCrvPrice: BigNumber;
  hysiBalance: BigNumber;
  hysiPrice: BigNumber;
  withdrawal: Boolean;
  setwithdrawal: Dispatch<Boolean>;
  depositAmount: BigNumber;
  setDepositAmount: Dispatch<BigNumber>;
  useUnclaimedDeposits: Boolean;
  setUseUnclaimedDeposits: Dispatch<Boolean>;
}

const TokenInput: React.FC<TokenInputProps> = ({
  threeCrvBalance,
  threeCrvPrice,
  hysiBalance,
  hysiPrice,
  withdrawal,
  setwithdrawal,
  depositAmount,
  setDepositAmount,
  useUnclaimedDeposits,
  setUseUnclaimedDeposits,
}) => {
  const [estimatedAmount, setEstimatedAmount] = useState<number>(0);
  const [validInputAmount, setValidInputAmount] = useState<Boolean>(true);

  useEffect(() => {
    if (depositAmount.toString() !== '0') {
      calcOutputAmountsFromInput(depositAmount, withdrawal);
    }
  }, []);

  useEffect(() => {
    setValidInputAmount(
      withdrawal
        ? depositAmount <= hysiBalance
        : depositAmount <= threeCrvBalance,
    );
  }, [depositAmount]);

  function updateWithOuputAmounts(value: number, withdrawal): void {
    setEstimatedAmount(value);
    if (withdrawal) {
      setDepositAmount(
        scaleNumberToBigNumber(value).mul(threeCrvPrice).div(hysiPrice),
      );
    } else {
      setDepositAmount(
        scaleNumberToBigNumber(value).mul(hysiPrice).div(threeCrvPrice),
      );
    }
  }

  function updateWithInputAmounts(value: number, withdrawal: Boolean): void {
    const raisedValue = scaleNumberToBigNumber(value);
    setDepositAmount(raisedValue);
    calcOutputAmountsFromInput(raisedValue, withdrawal);
  }

  function calcOutputAmountsFromInput(
    value: BigNumber,
    withdrawal: Boolean,
  ): void {
    if (withdrawal) {
      setEstimatedAmount(
        bigNumberToNumber(value.mul(hysiPrice).div(threeCrvPrice)),
      );
    } else {
      setEstimatedAmount(
        bigNumberToNumber(value.mul(threeCrvPrice).div(hysiPrice)),
      );
    }
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
              onChange={(e) =>
                updateWithInputAmounts(Number(e.target.value), withdrawal)
              }
            />
            <div className="flex flex-row items-center">
              <p
                className="text-gray-400 mr-3 border border-gray-400 p-1 rounded cursor-pointer hover:bg-gray-50 hover:border-gray-500 hover:text-gray-600"
                onClick={(e) => {
                  setDepositAmount(withdrawal ? hysiBalance : threeCrvBalance);
                  calcOutputAmountsFromInput(
                    withdrawal ? hysiBalance : threeCrvBalance,
                    withdrawal,
                  );
                }}
              >
                MAX
              </p>
              <p className="text-gray-700">{withdrawal ? 'HYSI' : '3CRV'}</p>
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
        <div className="relative flex justify-center my-8">
          <div className="w-16 bg-white">
            <div
              className="flex mx-auto w-10 h-10 rounded-full border border-gray-200 items-center cursor-pointer hover:bg-gray-50 hover:border-gray-400"
              onClick={(e) => setwithdrawal(!withdrawal)}
            >
              <img
                src="/images/exchangeIcon.svg"
                alt="exchangeIcon"
                className="mx-auto p-3"
              ></img>
            </div>
          </div>
        </div>
      </div>
      <div className="">
        <p className="font-semibold text-sm text-gray-900 mb-1">
          {`Estimated ${withdrawal ? '3CRV' : 'HYSI'} Amount`}
        </p>
        <div className="rounded-md border border-gray-200 px-2 py-4">
          <div className="flex flex-row justify-between">
            <input
              className="w-96"
              placeholder="-"
              value={estimatedAmount}
              onChange={(e) =>
                updateWithOuputAmounts(Number(e.target.value), withdrawal)
              }
            />
            <p className="text-gray-700">{withdrawal ? '3CRV' : 'HYSI'}</p>
          </div>
        </div>
      </div>
    </>
  );
};
export default TokenInput;
