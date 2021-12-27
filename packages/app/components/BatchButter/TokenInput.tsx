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
  img?: string;
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
      <div className="mt-10">
        <p className="mb-1 text-sm font-semibold text-gray-900">
          Deposit Amount
        </p>
        <div
          className={`rounded-md border py-2 pl-2 pr-4 ${
            depositDisabled ? 'border-red-600' : 'border-gray-200'
          }`}
        >
          <div className="flex flex-row items-center justify-between">
            <input
              className="w-8/12 mr-4 font-semibold leading-none text-gray-500 border-none focus:text-gray-800 focus:outline-none"
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
                className="px-2 pb-1 pt-1.5 leading-none text-blue-700 font-semibold border-3 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-700"
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
        <label className="flex flex-row items-center w-7/12 mt-3 cursor-pointer group">
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
        <div className="relative flex justify-center my-16">
          <div className="w-20 bg-white">
            <div
              className="flex items-center w-14 h-14 mx-auto border border-gray-200 rounded-full cursor-pointer hover:bg-gray-50 hover:border-gray-400"
              onClick={(e) => setRedeeming(!redeeming)}
            >
              <img
                src="/images/icons/exchangeIcon.svg"
                alt="exchangeIcon"
                className="p-3 mx-auto"
              ></img>
            </div>
          </div>
        </div>
      </div>
      <div className="">
        <p className="mb-1 text-sm font-semibold text-gray-900">
          {`Estimated ${selectedToken.output.name} Amount`}
        </p>
        <div className="py-2 pl-2 pr-5 border border-gray-200 rounded-md">
          <div className="flex flex-row items-center justify-between">
            <input
              className="mr-1 font-semibold leading-none text-gray-500 border-none w-36 smlaptop:w-64 smlaptop:mr-0 focus:outline-none focus:text-gray-800"
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
