import React, { useContext } from "react";
import { store } from "@popcorn/components/context/store";
import WalletSelectModal from "@popcorn/components/components/Modal/WalletSelectModal";

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
