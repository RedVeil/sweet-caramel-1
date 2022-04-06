import React, { useContext } from "react";
import { store } from "../../context/store";
import MultiChoiceActionModal from "./MultiChoiceActionModal";

export const MultiChoiceActionModalContainer: React.FC = () => {
  const {
    state: { multiChoiceActionModal },
  } = useContext(store);
  return (
    <MultiChoiceActionModal
      visible={multiChoiceActionModal.visible}
      title={multiChoiceActionModal.title}
      content={multiChoiceActionModal.content}
      children={multiChoiceActionModal.children}
      image={multiChoiceActionModal.image}
      type={multiChoiceActionModal.type}
      onDismiss={multiChoiceActionModal.onDismiss}
      onConfirm={multiChoiceActionModal.onConfirm}
    />
  );
};
