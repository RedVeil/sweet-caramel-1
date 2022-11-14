import MobileFullScreenModal from "@popcorn/app/components/Modal/MobileFullScreenModal";
import { store } from "@popcorn/app/context/store";
import React, { useContext } from "react";

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
