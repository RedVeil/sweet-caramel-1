import React, { useContext } from "react";
import { store } from "../../context/store";
import SingleActionModal from "./SingleActionModal";

export const SingleActionModalContainer: React.FC = () => {
  const {
    state: { singleActionModal },
  } = useContext(store);
  return (
    <SingleActionModal
      visible={singleActionModal.visible}
      title={singleActionModal.title}
      content={singleActionModal.content}
      children={singleActionModal.children}
      image={singleActionModal.image}
      type={singleActionModal.type}
      onDismiss={singleActionModal.onDismiss}
      onConfirm={singleActionModal.onConfirm}
      keepOpen={singleActionModal.keepOpen}
      showCloseButton={singleActionModal.showCloseButton}
    />
  );
};
