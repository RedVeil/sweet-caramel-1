import { BigNumber } from 'ethers';
import { BatchProcessTokens, SelectedToken } from 'pages/butter';
import { Dispatch, useEffect, useState } from 'react';
import { bigNumberToNumber, scaleNumberToBigNumber } from '../../../utils';
import SelectToken from './SelectToken';

export interface BatchProcessToken {
  name: string;
  key: string;
  balance: BigNumber;
  allowance: BigNumber;
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
  depositDisabled: boolean;
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
  depositDisabled,
}) => {
  const [estimatedAmount, setEstimatedAmount] = useState<number>(0);

  useEffect(() => {
    if (depositAmount.toString() !== '0') {
      calcOutputAmountsFromInput(depositAmount);
    }
  }, []);

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
          className={`rounded-md border p-2 ${
            depositDisabled ? 'border-red-600' : 'border-gray-200'
          }`}
        >
          <div className="flex flex-row justify-between items-center">
            <input
              className="w-56 border-none leading-none font-semibold text-gray-500 focus:text-gray-800 focus:outline-none"
              type="number"
              value={bigNumberToNumber(depositAmount)}
              onChange={(e) =>
                updateWithInputAmounts(
                  e.target.value === '' ? 0 : Number(e.target.value),
                )
              }
            />
            <div className="flex flex-row items-center">
              <p
                className="text-gray-400 mr-3 border leading-none border-gray-400 px-2 py-2 rounded cursor-pointer hover:bg-gray-50 hover:border-gray-500 hover:text-gray-600"
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
              <SelectToken
                allowSelection={!redeeming}
                selectedToken={selectedToken.input}
                token={token}
                notSelectable={[
                  selectedToken.input.key,
                  redeeming ? 'threeCrv' : 'butter',
                ]}
                selectToken={selectToken}
              />
            </div>
          </div>
        </div>
        <label className="w-7/12 flex flex-row items-center mt-3 cursor-pointer group">
          <input
            type="checkbox"
            className="mr-2 rounded-sm"
            onChange={(e) => setUseUnclaimedDeposits(!useUnclaimedDeposits)}
          />
          <p className="text-base mt-0.5 text-gray-600 leading-none group-hover:text-blue-700">
            Use unclaimed Balances
          </p>
        </label>

        {depositDisabled && (
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
        <div className="rounded-md border border-gray-200 p-2">
          <div className="flex flex-row items-center justify-between">
            <input
              className="w-64 border-none leading-none font-semibold text-gray-500 focus:outline-none focus:text-gray-800"
              type="number"
              value={estimatedAmount}
              onChange={(e) =>
                updateWithOuputAmounts(
                  e.target.value === '' ? 0 : Number(e.target.value),
                )
              }
            />
            <SelectToken
              allowSelection={false}
              selectedToken={selectedToken.output}
              token={token}
              notSelectable={[
                selectedToken.output.key,
                redeeming ? 'butter' : 'threeCrv',
              ]}
              selectToken={() => {}}
            />
          </div>
        </div>
      </div>
    </>
  );
};
export default TokenInput;
