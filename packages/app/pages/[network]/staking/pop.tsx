import SuccessfulStakingModal from "@popcorn/app/components/staking/SuccessfulStakingModal";
import { ChainId } from "@popcorn/utils";
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
  const { data: stakingPool } = usePopLocker(contractAddresses.popStaking);
  const balances = useBalanceAndAllowance(stakingPool?.stakingToken, account, contractAddresses.popStaking);
  const stakingToken = stakingPool?.stakingToken;
  const approveToken = useApproveERC20();
  const tokenPrice = useTokenPrice(stakingToken?.address);

  function stake(): void {
    toast.loading("Staking POP ...");
    stakingPool?.contract
      .connect(signer)
      .lock(account, form.amount, 0)
      .then((res) =>
        onContractSuccess(res, "POP staked!", () => {
          balances.revalidate();
          setForm(defaultForm);
          if (!localStorage.getItem("hideStakeSuccessPopover")) {
            dispatch(
              setMultiChoiceActionModal({
                title: "You have successfully staked your POP",
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
      .then((res) => {
        onContractSuccess(res, "POP Restaked!", () => {
          balances.revalidate();
          setForm(defaultForm);
        });
        dispatch(setSingleActionModal(false));
      })
      .catch((err) => onContractError(err));
  }

  const openTermsModal = () => {
    dispatch(
      setSingleActionModal({
        title: "Terms & Conditions",
        children: <TermsContent restake={restake} />,
      }),
    );
  };

  function approve() {
    toast.loading("Approving POP ...");
    approveToken(stakingToken.contract.connect(signer), stakingPool.address, "POP approved!", () => {
      balances.revalidate();
    });
  }

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
