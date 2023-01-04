import React, { useContext } from "react";
import { store } from "@popcorn/components/context/store";
import MobileFullScreenModal from "@popcorn/components/components/Modal/MobileFullScreenModal";

export const MobileFullScreenModalContainer: React.FC = () => {
  const {
    state: { mobileFullScreenModal },
  } = useContext(store);
  return (
    <MobileFullScreenModal
      visible={mobileFullScreenModal.visible}
      title={mobileFullScreenModal.title}
      content={mobileFullScreenModal.content}
      image={mobileFullScreenModal.image}
      type={mobileFullScreenModal.type}
      onDismiss={mobileFullScreenModal.onDismiss}
      children={mobileFullScreenModal.children}
    />
  );
};
