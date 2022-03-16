import { MultiChoiceActionModalProps } from "@popcorn/app/components/Modal/MultiChoiceActionModal";
import { SingleActionModalProps } from "@popcorn/app/components/Modal/SingleActionModal";
import { DualActionModalProps } from "@popcorn/app/components/Modal/DualActionModal";
import { setDualActionWideModal, setMultiChoiceActionModal, setSingleActionModal } from "@popcorn/app/context/actions";

export enum ModalType {
  SingleAction,
  MultiChoice,
  DualAction,
}

export const toggleModal = (
  modalType: ModalType,
  modalConfig: Partial<MultiChoiceActionModalProps> | Partial<SingleActionModalProps> | Partial<DualActionModalProps>,
  key: string,
  dispatch: React.Dispatch<any>,
) => {
  if (!localStorage.getItem(key)) {
    if ((modalType = ModalType.SingleAction)) {
      dispatch(setSingleActionModal(modalConfig as Partial<SingleActionModalProps>));
    } else if ((modalType = ModalType.MultiChoice)) {
      dispatch(setMultiChoiceActionModal(modalConfig as Partial<MultiChoiceActionModalProps>));
    } else {
      dispatch(setDualActionWideModal(modalConfig as Partial<DualActionModalProps>));
    }
    localStorage.setItem(key, "true");
  }
};
