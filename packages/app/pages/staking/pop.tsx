import Navbar from "components/NavBar/NavBar";
import StakeInterface, { defaultForm, InteractionType } from "components/staking/StakeInterface";
import StakeInterfaceLoader from "components/staking/StakeInterfaceLoader";
import useBalanceAndAllowance from "hooks/staking/useBalanceAndAllowance";
import usePopLocker from "hooks/staking/usePopLocker";
import useApproveERC20 from "hooks/tokens/useApproveERC20";
import useWeb3 from "hooks/useWeb3";
import "rc-slider/assets/index.css";
import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function PopStakingPage(): JSX.Element {
  const { account, signer, contractAddresses, onContractSuccess, onContractError, isContractReady } = useWeb3();

  const [form, setForm] = useState(defaultForm);
  const { data: stakingPool } = usePopLocker(contractAddresses.popStaking);
  const balances = useBalanceAndAllowance(stakingPool?.stakingToken, account, contractAddresses.popStaking);
  const stakingToken = stakingPool?.stakingToken;

  const approveToken = useApproveERC20();

  function stake(): void {
    toast.loading("Staking POP ...");
    stakingPool?.contract
      .connect(signer)
      .lock(account, form.amount, 0)
      .then((res) =>
        onContractSuccess(res, "POP staked!", () => {
          balances.revalidate();
          setForm(defaultForm);
        }),
      )
      .catch((err) => onContractError(err));
  }

  function withdraw(): void {
    toast.loading("Withdrawing POP ...");
    stakingPool?.contract
      .connect(signer)
      ["processExpiredLocks(bool)"](false)
      .then((res) =>
        onContractSuccess(res, "POP withdrawn!", () => {
          balances.revalidate();
          setForm({ ...defaultForm, type: InteractionType.Withdraw });
        }),
      )
      .catch((err) => onContractError(err));
  }

  function restake(): void {
    toast.loading("Restaking POP ...");
    stakingPool.contract
      .connect(signer)
      ["processExpiredLocks(bool)"](true)
      .then((res) =>
        onContractSuccess(res, "POP Restaked!", () => {
          balances.revalidate();
          setForm(defaultForm);
        }),
      )
      .catch((err) => onContractError(err));
  }

  function approve() {
    toast.loading("Approving POP ...");
    approveToken(stakingToken.contract.connect(signer), stakingPool.address, "POP approved!", () => {
      balances.revalidate();
    });
  }

  return (
    <>
      <div className="overflow-hidden w-screen">
        <Navbar />
        <Toaster position="top-right" />
        <div className="lg:w-11/12 lglaptop:w-9/12 2xl:max-w-7xl mx-auto pb-28">
          {!stakingPool ? (
            <StakeInterfaceLoader />
          ) : (
            <StakeInterface
              stakingPool={stakingPool}
              user={balances}
              form={[form, setForm]}
              stake={stake}
              withdraw={withdraw}
              approve={approve}
              restake={restake}
              onlyView={!account}
              isPopLocker
            />
          )}
        </div>
      </div>
    </>
  );
}
