import WalletSelectModal from "@popcorn/app/components/Modal/WalletSelectModal";
import { store } from "@popcorn/app/context/store";
import React, { useContext } from "react";

export const WalletSelectModalContainer: React.FC = () => {
  const {
    state: { walletSelectModal },
  } = useContext(store);
  return (
    <WalletSelectModal
      visible={walletSelectModal.visible}
      content={walletSelectModal.content}
      children={walletSelectModal.children}
      image={walletSelectModal.image}
      type={walletSelectModal.type}
      onDismiss={walletSelectModal.onDismiss}
      onConfirm={walletSelectModal.onConfirm}
      keepOpen={walletSelectModal.keepOpen}
      closeModal={walletSelectModal.closeModal}
    />
  );
};
