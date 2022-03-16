import { StakingPool } from "@popcorn/utils/src/types";
import TokenInput from "components/Common/TokenInput";
import MainActionButton from "components/MainActionButton";
import TermsAndConditions from "components/StakingTermsAndConditions";
import { BigNumber } from "ethers";
import { Dispatch, SetStateAction } from "react";
import { InteractionType, StakingForm } from "./StakeInterface";

export interface StakingInteractionProps {
  stakingPool: StakingPool;
  form: [StakingForm, Dispatch<SetStateAction<StakingForm>>];
  user: {
    balance: BigNumber;
    allowance: BigNumber;
  };
  onlyView: boolean;
  approve: () => void;
  stake: () => void;
  withdraw: () => void;
}

export default function StakingInteraction({
  stakingPool,
  user,
  form,
  onlyView,
  approve,
  stake,
  withdraw,
}: StakingInteractionProps): JSX.Element {
  const stakingToken = stakingPool?.stakingToken;
  const [state, setState] = form;
  const { type, amount, termsAccepted } = state;
  const withdrawal = type === InteractionType.Withdraw;
  const deposit = type === InteractionType.Deposit;
  return (
    <>
      <div className="pt-16 pb-10">
        <TokenInput
          label={withdrawal ? "Unstake Amount" : "Stake Amount"}
          token={stakingPool?.stakingToken}
          amount={amount}
          setAmount={(amt) => setState({ ...state, amount: amt })}
          balance={withdrawal ? stakingPool?.userStake : user.balance}
        />
      </div>
      {withdrawal && (
        <div className="mx-auto pt-2">
          <MainActionButton
            label={`Withdraw ${stakingToken?.symbol}`}
            handleClick={withdraw}
            disabled={onlyView || stakingPool?.userStake.isZero() || amount.isZero()}
          />
        </div>
      )}
      {deposit && (
        <>
          <TermsAndConditions
            isDisabled={onlyView}
            termsAccepted={termsAccepted}
            setTermsAccepted={(accepted) => setState({ ...state, termsAccepted: accepted })}
          />
          {amount.lt(user.allowance) ? (
            <div className="mx-auto pt-2 pb-6">
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
                disabled={onlyView || !termsAccepted || amount.gt(user.allowance) || amount.isZero()}
              />
            </div>
          )}
        </>
      )}
    </>
  );
}
