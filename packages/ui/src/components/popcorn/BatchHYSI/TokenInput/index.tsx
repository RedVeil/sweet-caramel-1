import { SwitchVerticalIcon } from '@heroicons/react/outline';
import { bigNumberToNumber, scaleNumberToBigNumber } from '@popcorn/utils';
import { BigNumber } from 'ethers';
import React, { Dispatch, useEffect, useState } from 'react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}
export interface TokenInputProps {
  threeCrvBalance: BigNumber;
  threeCrvPrice: BigNumber;
  hysiBalance: BigNumber;
  hysiPrice: BigNumber;
  withdrawal: Boolean;
  setwithdrawal: (boolean) => void;
  depositAmount: BigNumber;
  setDepositAmount: Dispatch<BigNumber>;
  useUnclaimedDeposits: Boolean;
  setUseUnclaimedDeposits: (boolean) => void;
}

type AvailableCcys = 'USDC' | 'FRAX' | 'UST' | 'USDN';

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
  const [validInputAmount, setValidInputAmount] = useState<Boolean>(false);
  const [ccy, setCcy] = useState<AvailableCcys>('USDC');

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
      {!withdrawal && (
        <>
          <div className="mt-6">
            <div>
              <label
                htmlFor="deposit"
                className="block text-sm font-medium text-gray-700"
              >
                Deposit Amount
              </label>
              <div
                className={classNames(
                  'mt-1 relative rounded-md shadow-sm border',
                  validInputAmount ? 'border-gray-200' : 'border-red-600',
                )}
              >
                <input
                  type="text"
                  name="deposit"
                  id="deposit"
                  value={bigNumberToNumber(depositAmount)}
                  onChange={(e) =>
                    updateWithInputAmounts(Number(e.target.value), withdrawal)
                  }
                  className={
                    'focus:ring-indigo-500 focus:border-indigo-500 block w-full text-gray-500 sm:text-sm rounded-md pl-4 py-3'
                  }
                  placeholder="0.00"
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <label htmlFor="ccy" className="sr-only">
                    Deposit Currency
                  </label>
                  <select
                    id="ccy"
                    name="ccy"
                    className="focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-2 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md"
                    onChange={(e) => setCcy(e.target.value as AvailableCcys)}
                  >
                    <option>USDC</option>
                    <option>FRAX</option>
                    <option>USDN</option>
                    <option>UST</option>
                  </select>
                </div>
              </div>
            </div>
            {!validInputAmount && (
              <p className="mt-2 text-sm font-medium text-red-600">
                Insufficient Balance
              </p>
            )}
            <label className="flex flex-row items-center mt-1">
              <input
                type="checkbox"
                className="mr-2 rounded-sm"
                onChange={(e) => setUseUnclaimedDeposits(!useUnclaimedDeposits)}
              />
              <p className="text-sm font-medium text-gray-700">{`Deposit entire ${ccy} balance`}</p>
            </label>
          </div>
          <div className="relative">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center my-8">
              <div className="w-16 bg-white">
                <div className="flex mx-auto w-10 h-10 rounded-full border border-gray-200 items-center">
                  <SwitchVerticalIcon className="h-7 w-7 text-gray-400 align-middle mx-auto" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label
              htmlFor="deposit-amount"
              className="block text-sm font-medium text-gray-700"
            >
              {`Estimated ${withdrawal ? '3CRV' : 'HYSI'} Amount`}
            </label>
            <div className="mt-1 relative rounded-md shadow-sm border">
              <input
                type="number"
                name="deposit-amount"
                id="deposit-amount"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full text-gray-500 sm:text-sm border-gray-200 rounded-md pl-4 py-3 "
                placeholder="-"
                value={estimatedAmount}
                onChange={(e) =>
                  updateWithOuputAmounts(Number(e.target.value), withdrawal)
                }
                aria-describedby="deposit-amount"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm" id="price-currency">
                  {withdrawal ? '3CRV' : 'HYSI'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {withdrawal && (
        <>
          <div className="mt-6">
            <div className="">
              <label
                htmlFor="withdrawal-amount"
                className="block text-sm font-medium text-gray-700"
              >
                Withdrawal Amount
              </label>
              <div className="mt-1 relative rounded-md shadow-sm border">
                <input
                  type="number"
                  name="withdrawal-amount"
                  id="withdrawal-amount"
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full text-gray-500 sm:text-sm border-gray-200 rounded-md pl-4 py-3 "
                  placeholder="-"
                  value={estimatedAmount}
                  onChange={(e) =>
                    updateWithOuputAmounts(Number(e.target.value), withdrawal)
                  }
                  aria-describedby="withdrawal-amount"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span
                    className="text-gray-500 sm:text-sm"
                    id="price-currency"
                  >
                    {withdrawal ? '3CRV' : 'HYSI'}
                  </span>
                </div>
              </div>
            </div>

            <label className="flex flex-row items-center mt-2">
              <input
                type="checkbox"
                className="mr-2 rounded-sm"
                onChange={(e) => setUseUnclaimedDeposits(!useUnclaimedDeposits)}
              />
              <p className="text-sm font-medium text-gray-700">{`Withdraw entire USD balance`}</p>
            </label>
            {!validInputAmount && (
              <p className="text-red-600">Insufficient Balance</p>
            )}
          </div>
          <div className="relative">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center my-8">
              <div className="w-16 bg-white">
                <div className="flex mx-auto w-10 h-10 rounded-full border border-gray-200 items-center">
                  <SwitchVerticalIcon className="h-7 w-7 text-gray-400 align-middle mx-auto" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div>
              <label
                htmlFor="withdrawal"
                className="block text-sm font-medium text-gray-700"
              >
                Estimated Stablecoin withdrawal
              </label>
              <div className="mt-1 relative rounded-md shadow-sm border">
                <input
                  type="text"
                  name="withdrawal"
                  id="withdrawal"
                  value={bigNumberToNumber(depositAmount)}
                  onChange={(e) =>
                    updateWithInputAmounts(Number(e.target.value), withdrawal)
                  }
                  className={classNames(
                    'focus:ring-indigo-500 focus:border-indigo-500 block w-full text-gray-500 sm:text-sm border-gray-300 rounded-md pl-4 py-3',
                    validInputAmount ? 'border-gray-200' : 'border-red-600',
                  )}
                  placeholder="0.00"
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <label htmlFor="ccy" className="sr-only">
                    Currency
                  </label>
                  <select
                    id="ccy"
                    name="ccy"
                    className="focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-2 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md"
                    onChange={(e) => setCcy(e.target.value as AvailableCcys)}
                  >
                    <option>USDC</option>
                    <option>FRAX</option>
                    <option>USDN</option>
                    <option>UST</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
export default TokenInput;
