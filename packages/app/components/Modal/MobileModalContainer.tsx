import React, { useContext } from "react";
import { store } from "../../context/store";
import MobileModal from "./MobileModal";

export const MobileModalContainer: React.FC = () => {
  const { mobileFullScreenModal } = useContext(store).state;
  return (
    <MobileModal
      visible={mobileFullScreenModal.visible}
      title={mobileFullScreenModal.title}
      content={mobileFullScreenModal.content}
      image={mobileFullScreenModal.image}
      type={mobileFullScreenModal.type}
      onDismiss={mobileFullScreenModal.onDismiss}
    />
  );
};
