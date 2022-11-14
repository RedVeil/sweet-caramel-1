import DualActionModal from "@popcorn/app/components/Modal/DualActionModal";
import { store } from "@popcorn/app/context/store";
import React, { useContext } from "react";

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
    />
  );
};
export default DualActionModalContainer;
