import NetworkChangePromptModal from "@popcorn/app/components/Modal/NetworkChangePromptModal";
import { store } from "@popcorn/app/context/store";
import React, { useContext } from "react";

export const NetworkChangePromptModalContainer: React.FC = () => {
  const {
    state: { networkChangePromptModal },
  } = useContext(store);

  return (
    <NetworkChangePromptModal
      visible={networkChangePromptModal.visible}
      title={networkChangePromptModal.title}
      content={networkChangePromptModal.content}
      children={networkChangePromptModal.children}
      image={networkChangePromptModal.image}
      type={networkChangePromptModal.type}
      onChangeNetwork={networkChangePromptModal.onChangeNetwork}
      onChangeUrl={networkChangePromptModal.onChangeUrl}
      onDisconnect={networkChangePromptModal.onDisconnect}
      onDismiss={networkChangePromptModal.onDismiss}
    />
  );
};
