import Navbar from "components/NavBar/NavBar";
import useBalanceAndAllowance from "hooks/staking/useBalanceAndAllowance";
import useStakingPool from "hooks/staking/useStakingPool";
import useApproveERC20 from "hooks/tokens/useApproveERC20";
import useWeb3 from "hooks/useWeb3";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import StakeInterface, { defaultForm, InteractionType } from "../../components/staking/StakeInterface";
import StakeInterfaceLoader from "../../components/staking/StakeInterfaceLoader";

export default function StakingPage(): JSX.Element {
  const { account, signer, contractAddresses, chainId, onContractSuccess, onContractError, isContractReady } =
    useWeb3();
  const router = useRouter();

  useEffect(() => {
    if (!!((router.query?.id as string) || false) && !contractAddresses.has(router.query.id as string)) {
      router.push("/staking");
    }
  }, [contractAddresses, router]);

  const [form, setForm] = useState(defaultForm);
  const { data: stakingPool } = useStakingPool(router.query.id as string);
  const balances = useBalanceAndAllowance(stakingPool?.stakingToken, account, stakingPool?.address);
  const stakingToken = stakingPool?.stakingToken;
  const isLoading = !stakingPool;

  const approveToken = useApproveERC20();

  function stake(): void {
    toast.loading(`Staking ${stakingToken?.name} ...`);
    stakingPool.contract
      .connect(signer)
      .stake(form.amount)
      .then((res) =>
        onContractSuccess(res, `${stakingToken?.name} staked!`, () => {
          setForm(defaultForm);
          balances.revalidate();
        }),
      )
      .catch((err) => onContractError(err));
  }

  function withdraw(): void {
    toast.loading(`Withdrawing ${stakingToken?.name} ...`);
    stakingPool.contract
      .connect(signer)
      .withdraw(form.amount)
      .then((res) =>
        onContractSuccess(res, `${stakingToken?.name} withdrawn!`, () => {
          setForm({ ...defaultForm, type: InteractionType.Withdraw });
          balances.revalidate();
        }),
      )
      .catch((err) => onContractError(err));
  }

  function approve(): void {
    toast.loading(`Approving ${stakingToken?.name} ...`);
    approveToken(stakingToken.contract.connect(signer), stakingPool.address, `${stakingToken?.name} approved!`, () =>
      balances.revalidate(),
    );
  }

  return (
    <div className="overflow-x-hidden w-full">
      <Navbar />
      <Toaster position="top-right" />
      <div className="lg:w-11/12 lglaptop:w-9/12 2xl:max-w-7xl mx-auto pb-28">
        {isLoading ? (
          <StakeInterfaceLoader />
        ) : (
          <StakeInterface
            stakingPool={stakingPool}
            user={balances}
            form={[form, setForm]}
            stake={stake}
            withdraw={withdraw}
            approve={approve}
            onlyView={!account}
          />
        )}
      </div>
    </div>
  );
}
