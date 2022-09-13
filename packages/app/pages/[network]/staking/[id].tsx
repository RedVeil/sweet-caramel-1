import SuccessfulStakingModal from "@popcorn/app/components/staking/SuccessfulStakingModal";
import { formatAndRoundBigNumber } from "@popcorn/utils";
import TransactionToast from "components/Notifications/TransactionToast";
import { setMultiChoiceActionModal } from "context/actions";
import { store } from "context/store";
import useBalanceAndAllowance from "hooks/staking/useBalanceAndAllowance";
import useStakingPool from "hooks/staking/useStakingPool";
import useApproveERC20 from "hooks/tokens/useApproveERC20";
import useTokenPrice from "hooks/useTokenPrice";
import useWeb3 from "hooks/useWeb3";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import StakeInterface, { defaultForm, InteractionType } from "../../../components/staking/StakeInterface";
import StakeInterfaceLoader from "../../../components/staking/StakeInterfaceLoader";

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
    const toastDescription = `${formatAndRoundBigNumber(form.amount, stakingToken.decimals)} ${stakingToken?.symbol}`
    TransactionToast.loading({ title: "Staking", description: toastDescription });

    stakingPool.contract
      .connect(signer)
      .stake(form.amount)
      .then((res) =>
        onContractSuccess(res, { title: "Staked successfully", description: toastDescription }, () => {
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
      .catch((err) => onContractError(err, `Staking ${toastDescription}`));
  }

  function withdraw(): void {
    const toastDescription = `${formatAndRoundBigNumber(form.amount, stakingToken.decimals)} ${stakingToken?.symbol}`
    TransactionToast.loading({ title: "Withdrawing", description: toastDescription });

    stakingPool.contract
      .connect(signer)
      .withdraw(form.amount)
      .then((res) =>
        onContractSuccess(res, { title: "Withdrew successfully", description: toastDescription }, () => {
          setForm({ ...defaultForm, type: InteractionType.Withdraw });
          refetchStakingPool();
          balances.revalidate();
        }),
      )
      .catch((err) => onContractError(err, `Withdrawing ${toastDescription}`));
  }

  function approve(): void {
    TransactionToast.loading({ title: "Approving", description: `${stakingToken.symbol} for Staking` })

    approveToken(
      stakingToken.contract.connect(signer),
      stakingPool.address,
      { title: "Approved successfully", description: `${stakingToken.symbol} for Staking` },
      `Approving ${stakingToken.symbol} for Staking`,
      () => balances.revalidate(),
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
