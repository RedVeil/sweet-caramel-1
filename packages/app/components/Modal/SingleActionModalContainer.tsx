import SingleActionModal from "@popcorn/app/components/Modal/SingleActionModal";
import { store } from "@popcorn/app/context/store";
import React, { useContext } from "react";

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
      isTerms={singleActionModal.isTerms}
    />
  );
};
