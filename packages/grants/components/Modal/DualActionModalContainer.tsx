import React, { useContext } from "react";
import { store } from "../../context/store";
import DualActionModal from "./DualActionModal";

export const DualActionModalContainer: React.FC = () => {
  const {
    state: { dualActionModal },
  } = useContext(store);
  return (
    <DualActionModal
      visible={dualActionModal.visible}
      title={dualActionModal.title}
      content={dualActionModal.content}
      onDismiss={dualActionModal.onDismiss}
      onConfirm={dualActionModal.onConfirm}
      icon={dualActionModal.icon}
    />
  );
};
export default DualActionModalContainer;
