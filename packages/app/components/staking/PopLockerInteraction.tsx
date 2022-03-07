import { formatAndRoundBigNumber } from "@popcorn/utils";
import TokenInput from "components/Common/TokenInput";
import MainActionButton from "components/MainActionButton";
import TermsAndConditions from "components/StakingTermsAndConditions";
import { InteractionType } from "./StakeInterface";
import { StakingInteractionProps } from "./StakingInteraction";

interface PopLockerInteractionProps extends StakingInteractionProps {
  restake: () => void;
}

export default function PopLockerInteraction({
  stakingPool,
  user,
  form,
  onlyView,
  approve,
  stake,
  withdraw,
  restake,
}: PopLockerInteractionProps): JSX.Element {
  const [state, setState] = form;
  const { type, amount, termsAccepted } = { ...state };
  const withdrawal = type === InteractionType.Withdraw;
  const deposit = type === InteractionType.Deposit;
  const stakingToken = stakingPool?.stakingToken;

  return (
    <>
      {withdrawal && (
        <div className="pt-16 mx-auto">
          <div className="w-full mb-10">
            <label htmlFor="tokenInput" className="flex justify-between text-sm font-medium text-gray-700 text-center">
              <p className="mb-2  text-base">Withdrawable Amount</p>
            </label>
            <div className="mt-1 relative flex items-center">
              <input
                type="string"
                name="tokenInput"
                id="tokenInput"
                className="shadow-sm block w-full pl-4 pr-16 py-4 text-lg border-gray-300 bg-gray-100 rounded-xl"
                value={formatAndRoundBigNumber(stakingPool?.withdrawable)}
                disabled
              />
              <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                <p className="inline-flex items-center  font-medium text-lg mx-3">POP</p>
              </div>
            </div>
          </div>
          <div className="flex flex-row items-center space-x-4">
            <MainActionButton
              label={"Restake POP"}
              handleClick={restake}
              disabled={onlyView || stakingPool?.withdrawable.isZero()}
            />
            <MainActionButton
              label={"Withdraw POP"}
              handleClick={withdraw}
              disabled={onlyView || stakingPool?.withdrawable.isZero()}
            />
          </div>
        </div>
      )}
      {deposit && (
        <>
          <div className="pt-16 pb-10">
            <TokenInput
              label={withdrawal ? "Unstake Amount" : "Stake Amount"}
              token={stakingPool?.stakingToken}
              amount={amount}
              balance={user.balance}
              setAmount={(_amount) => {
                setState({ ...state, amount: _amount });
              }}
            />
          </div>
          <TermsAndConditions
            isDisabled={onlyView}
            termsAccepted={termsAccepted}
            setTermsAccepted={(accepted) => setState({ ...state, termsAccepted: accepted })}
            showLockTerms
          />
          {user && amount.lt(user.allowance) ? (
            <div className="mx-auto pt-2 pb-6 bottom-0">
              <MainActionButton
                label={`Stake ${stakingToken?.symbol}`}
                handleClick={stake}
                disabled={onlyView || !termsAccepted || amount.isZero() || user.balance.isZero()}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <MainActionButton
                label={"Approve for Staking"}
                handleClick={approve}
                disabled={onlyView || amount.isZero()}
              />
              <MainActionButton
                label={`Stake ${stakingToken?.symbol}`}
                handleClick={stake}
                disabled={onlyView || !termsAccepted || !amount.lt(user.allowance)}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}
