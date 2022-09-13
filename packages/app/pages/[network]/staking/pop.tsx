import SuccessfulStakingModal from "@popcorn/app/components/staking/SuccessfulStakingModal";
import { ChainId, formatAndRoundBigNumber } from "@popcorn/utils";
import TransactionToast from "components/Notifications/TransactionToast";
import StakeInterface, { defaultForm, InteractionType } from "components/staking/StakeInterface";
import StakeInterfaceLoader from "components/staking/StakeInterfaceLoader";
import TermsContent from "components/staking/TermsModalContent";
import { setMultiChoiceActionModal, setSingleActionModal } from "context/actions";
import { store } from "context/store";
import useBalanceAndAllowance from "hooks/staking/useBalanceAndAllowance";
import usePopLocker from "hooks/staking/usePopLocker";
import useApproveERC20 from "hooks/tokens/useApproveERC20";
import useTokenPrice from "hooks/useTokenPrice";
import useWeb3 from "hooks/useWeb3";
import { useRouter } from "next/router";
import "rc-slider/assets/index.css";
import React, { useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function PopStakingPage(): JSX.Element {
  const { account, signer, contractAddresses, onContractSuccess, onContractError, chainId, pushWithinChain } =
    useWeb3();

  const { dispatch } = useContext(store);

  useEffect(() => {
    if ([ChainId.Arbitrum, ChainId.BNB].includes(chainId)) {
      pushWithinChain("/staking");
    }
  }, [chainId]);

  const [form, setForm] = useState(defaultForm);
  const router = useRouter();
  const { data: stakingPool } = usePopLocker(contractAddresses.popStaking);
  const balances = useBalanceAndAllowance(stakingPool?.stakingToken, account, contractAddresses.popStaking);
  const stakingToken = stakingPool?.stakingToken;
  const approveToken = useApproveERC20();
  const tokenPrice = useTokenPrice(stakingToken?.address);


  useEffect(() => {
    if (router?.query?.action === "withdraw") {
      setForm({ ...form, type: InteractionType.Withdraw });
    }
  }, [router?.query?.action]);

  function stake(): void {
    const toastDescription = `${formatAndRoundBigNumber(form.amount, stakingToken.decimals)} ${stakingToken?.symbol}`
    TransactionToast.loading({ title: "Staking", description: toastDescription })

    stakingPool?.contract
      .connect(signer)
      .lock(account, form.amount, 0)
      .then((res) =>
        onContractSuccess(res, { title: "Staked successfully", description: toastDescription }, () => {
          balances.revalidate();
          setForm(defaultForm);
          if (!localStorage.getItem("hideStakeSuccessPopover")) {
            dispatch(
              setMultiChoiceActionModal({
                title: "Successfully staked POP",
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
    TransactionToast.loading({ title: "Withdrawing", description: toastDescription })

    stakingPool?.contract
      .connect(signer)
    ["processExpiredLocks(bool)"](false)
      .then((res) =>
        onContractSuccess(res, { title: "Withdrew successfully", description: toastDescription }, () => {
          balances.revalidate();
          setForm({ ...defaultForm, type: InteractionType.Withdraw });
        }),
      )
      .catch((err) => onContractError(err, `Withdrawing ${toastDescription}`));
  }

  function restake(): void {
    const toastDescription = `${formatAndRoundBigNumber(stakingPool.withdrawable, stakingToken.decimals)} ${stakingToken?.symbol}`
    TransactionToast.loading({ title: "Restaking", description: toastDescription })

    stakingPool.contract
      .connect(signer)
    ["processExpiredLocks(bool)"](true)
      .then((res) => {
        onContractSuccess(res, { title: "Restaked successfully", description: toastDescription }, () => {
          balances.revalidate();
          setForm(defaultForm);
        });
        dispatch(setSingleActionModal(false));
      })
      .catch((err) => onContractError(err, `Restaking ${toastDescription}`));
  }

  function approve() {
    TransactionToast.loading({ title: "Approving", description: "POP for Staking" })

    approveToken(
      stakingToken.contract.connect(signer),
      stakingPool.address,
      { title: "Approved successfully", description: "POP for Staking" },
      "Approving POP for Staking",
      () => balances.revalidate())
  }

  const openTermsModal = () => {
    dispatch(
      setSingleActionModal({
        title: "Terms & Conditions",
        isTerms: true,
        children: <TermsContent restake={restake} />,
      }),
    );
  };

  return (
    <>
      {!stakingPool || !tokenPrice ? (
        <StakeInterfaceLoader />
      ) : (
        <StakeInterface
          stakingPool={stakingPool}
          user={balances}
          form={[form, setForm]}
          stake={stake}
          withdraw={withdraw}
          approve={approve}
          restake={openTermsModal}
          onlyView={!account}
          chainId={chainId}
          isPopLocker
          stakedTokenPrice={tokenPrice}
        />
      )}
    </>
  );
}
