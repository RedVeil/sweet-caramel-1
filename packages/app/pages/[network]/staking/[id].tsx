import SuccessfulStakingModal from "@popcorn/app/components/staking/SuccessfulStakingModal";
import { setMultiChoiceActionModal } from "@popcorn/app/context/actions";
import { store } from "@popcorn/app/context/store";
import useBalanceAndAllowance from "@popcorn/app/hooks/staking/useBalanceAndAllowance";
import useStakingPool from "@popcorn/app/hooks/staking/useStakingPool";
import useApproveERC20 from "@popcorn/app/hooks/tokens/useApproveERC20";
import useTokenPrice from "@popcorn/app/hooks/useTokenPrice";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import StakeInterface, { defaultForm, InteractionType } from "@popcorn/app/components/staking/StakeInterface";
import StakeInterfaceLoader from "@popcorn/app/components/staking/StakeInterfaceLoader";

export default function StakingPage(): JSX.Element {
  const { account, chainId, signer, contractAddresses, onContractSuccess, onContractError, pushWithinChain } =
    useWeb3();
  const router = useRouter();
  const { dispatch } = useContext(store);

  useEffect(() => {
    if (!!((router.query?.id as string) || false) && !contractAddresses.has(router.query.id as string)) {
      pushWithinChain("/staking");
    }
  }, [contractAddresses, router]);

  const [form, setForm] = useState(defaultForm);
  const { data: stakingPool, mutate: refetchStakingPool } = useStakingPool(router.query.id as string);
  const balances = useBalanceAndAllowance(stakingPool?.stakingToken, account, stakingPool?.address);
  const stakingToken = stakingPool?.stakingToken;
  const tokenPrice = useTokenPrice(stakingToken?.address);
  const isLoading = !stakingPool && !tokenPrice;
  const approveToken = useApproveERC20();

  function stake(): void {
    toast.loading(`Staking ${stakingToken?.symbol} ...`);
    stakingPool.contract
      .connect(signer)
      .stake(form.amount)
      .then((res) =>
        onContractSuccess(res, `${stakingToken?.symbol} staked!`, () => {
          setForm(defaultForm);
          refetchStakingPool();
          balances.revalidate();
          if (!localStorage.getItem("hideStakeSuccessPopover")) {
            dispatch(
              setMultiChoiceActionModal({
                title: `Successfully staked ${stakingToken?.symbol}`,
                children: SuccessfulStakingModal,
                image: <img src="/images/modalImages/successfulStake.svg" />,
                onConfirm: {
                  label: "Continue",
                  onClick: () => dispatch(setMultiChoiceActionModal(false)),
                },
                onDontShowAgain: {
                  label: "Do not remind me again",
                  onClick: () => {
                    localStorage.setItem("hideStakeSuccessPopover", "true");
                    dispatch(setMultiChoiceActionModal(false));
                  },
                },
                onDismiss: {
                  onClick: () => {
                    dispatch(setMultiChoiceActionModal(false));
                  },
                },
              }),
            );
          }
        }),
      )
      .catch((err) => onContractError(err));
  }

  function withdraw(): void {
    toast.loading(`Withdrawing ${stakingToken?.symbol} ...`);
    stakingPool.contract
      .connect(signer)
      .withdraw(form.amount)
      .then((res) =>
        onContractSuccess(res, `${stakingToken?.symbol} withdrawn!`, () => {
          setForm({ ...defaultForm, type: InteractionType.Withdraw });
          refetchStakingPool();
          balances.revalidate();
        }),
      )
      .catch((err) => onContractError(err));
  }

  function approve(): void {
    toast.loading(`Approving ${stakingToken?.symbol} ...`);
    approveToken(stakingToken.contract.connect(signer), stakingPool.address, `${stakingToken?.name} approved!`, () =>
      balances.revalidate(),
    );
  }

  return isLoading ? (
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
      chainId={chainId}
      stakedTokenPrice={tokenPrice}
    />
  );
}
