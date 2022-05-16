import SuccessfulStakingModal from "@popcorn/app/components/staking/SuccessfulStakingModal";
import { setMultiChoiceActionModal } from "context/actions";
import { store } from "context/store";
import useBalanceAndAllowance from "hooks/staking/useBalanceAndAllowance";
import useStakingPool from "hooks/staking/useStakingPool";
import useApproveERC20 from "hooks/tokens/useApproveERC20";
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
  const { data: stakingPool } = useStakingPool(router.query.id as string);
  const balances = useBalanceAndAllowance(stakingPool?.stakingToken, account, stakingPool?.address);
  const stakingToken = stakingPool?.stakingToken;
  const isLoading = !stakingPool;
  const approveToken = useApproveERC20();

  function stake(): void {
    toast.loading(`Staking ${stakingToken?.symbol} ...`);
    stakingPool.contract
      .connect(signer)
      .stake(form.amount)
      .then((res) =>
        onContractSuccess(res, `${stakingToken?.symbol} staked!`, () => {
          setForm(defaultForm);
          balances.revalidate();
          if (!localStorage.getItem("hideStakeSuccessPopover")) {
            dispatch(
              setMultiChoiceActionModal({
                title: `You have successfully staked ${stakingToken?.symbol}`,
                children: SuccessfulStakingModal,
                image: <img src="/images/stake/stake-success-modal.png" className="px-6" />,
                onConfirm: {
                  label: "Close",
                  onClick: () => dispatch(setMultiChoiceActionModal(false)),
                },
                onDismiss: {
                  label: "Do not remind me again",
                  onClick: () => {
                    localStorage.setItem("hideStakeSuccessPopover", "true");
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
    />
  );
}
