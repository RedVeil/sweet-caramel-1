import { InfoIconWithModal } from 'components/InfoIconWithModal';
import { BigNumber } from 'ethers';
import { escapeRegExp, inputRegex } from 'helper/inputRegex';
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
  const [estimatedAmount, setEstimatedAmount] = useState<string>('');
  const [displayDepositAmount, setDisplayDepositAmount] = useState<string>('');

  useEffect(() => {
    if (depositAmount.eq(BigNumber.from('0'))) {
      setDisplayDepositAmount('');
      setEstimatedAmount('');
    } else {
      setDisplayDepositAmount(String(bigNumberToNumber(depositAmount)));
      calcOutputAmountsFromInput(depositAmount);
    }
  }, [depositAmount]);

  function updateWithOuputAmounts(value: string): void {
    if (value !== '.') {
      const newDepositAmount = scaleNumberToBigNumber(Number(value))
        .mul(selectedToken.output.price)
        .div(selectedToken.input.price);
      setDepositAmount(newDepositAmount);
    } else {
      setDisplayDepositAmount('0');
    }
    setEstimatedAmount(value);
  }

  function updateWithInputAmounts(value: string): void {
    if (!['0.', '.'].includes(value)) {
      const raisedValue = scaleNumberToBigNumber(Number(value));
      setDepositAmount(raisedValue);
    } else {
      setDisplayDepositAmount(value);
    }
  }

  function calcOutputAmountsFromInput(value: BigNumber): void {
    setEstimatedAmount(
      String(
        bigNumberToNumber(
          value.mul(selectedToken.input.price).div(selectedToken.output.price),
        ),
      ),
    );
  }

  const enforcer = (nextUserInput: string, useOutput: boolean) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      if (useOutput) {
        updateWithOuputAmounts(nextUserInput);
      } else {
        updateWithInputAmounts(nextUserInput);
      }
    }
  };

  return (
    <>
      <div className="mt-10">
        <div className="flex flex-row items-center justify-between mb-1">
          <p className="text-sm font-semibold text-gray-900">Deposit Amount</p>
          <p className="text-gray-500 font-medium text-sm">
            {`${bigNumberToNumber(
              useUnclaimedDeposits
                ? selectedToken.input.claimableBalance
                : selectedToken.input.balance,
            ).toFixed(3)} ${selectedToken.input.name}`}
          </p>
        </div>
        <div
          className={`rounded-md border py-2 pl-2 pr-4 ${
            depositDisabled ? 'border-red-600' : 'border-gray-200'
          }`}
        >
          <div className="flex flex-row items-center justify-between">
            <input
              className="w-8/12 mr-4 font-semibold leading-none text-gray-500 border-none focus:text-gray-800 focus:outline-none"
              value={displayDepositAmount}
              onChange={(e) => {
                enforcer(e.target.value.replace(/,/g, '.'), false);
              }}
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              // text-specific options
              type="text"
              pattern="^[0-9]*[.,]?[0-9]*$"
              placeholder={'0.0'}
              minLength={1}
              maxLength={79}
              spellCheck="false"
            />
            <div className="flex flex-row items-center">
              <p
                className="px-2 pb-1 pt-1.5 leading-none text-blue-700 font-semibold border-3 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-700"
                onClick={(e) => {
                  const maxAmount = useUnclaimedDeposits
                    ? selectedToken.input.claimableBalance
                    : selectedToken.input.balance;
                  setDepositAmount(maxAmount);
                  setDisplayDepositAmount(String(bigNumberToNumber(maxAmount)));
                  calcOutputAmountsFromInput(maxAmount);
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
        <div className="flex flex-row items-center mt-2">
          <label className="flex flex-row items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={Boolean(useUnclaimedDeposits)}
              className="mr-2 rounded-sm"
              onChange={(e) => setUseUnclaimedDeposits(!useUnclaimedDeposits)}
            />
            <p className="text-base mt-0.5 text-gray-600 leading-none group-hover:text-blue-700">
              Use unclaimed balances
            </p>
          </label>
          <div className="mt-1">
            <InfoIconWithModal title="About Unclaimed Balances">
              <p>
                When a batch is minted but the Butter has not been claimed yet,
                it can be redeemed without having to claim it first. By checking
                “use unclaimed balances” you will be able to redeem unclaimed
                balances of Butter. This process applies also for unclaimed
                3CRV, which can be converted to Butter without having to claim
                it.
              </p>
            </InfoIconWithModal>
          </div>
        </div>

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
              value={estimatedAmount}
              onChange={(e) =>
                enforcer(e.target.value.replace(/,/g, '.'), true)
              }
              inputMode="decimal"
              autoComplete="off"
              autoCorrect="off"
              // text-specific options
              type="text"
              pattern="^[0-9]*[.,]?[0-9]*$"
              placeholder={'0.0'}
              minLength={1}
              maxLength={79}
              spellCheck="false"
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
