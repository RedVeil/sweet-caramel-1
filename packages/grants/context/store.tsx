import { DefaultDualActionWideModalProps, DualActionWideModalProps } from "components/Modal/DualActionWideModal";
import { DefaultMobileFullScreenModalProps, MobileFullScreenModalProps } from "components/Modal/MobileFullScreenModal";
import {
  DefaultMultiChoiceActionModalProps,
  MultiChoiceActionModalProps,
} from "components/Modal/MultiChoiceActionModal";
import {
  DefaultNetworkChangePromptModalProps,
  NetworkChangePromptModalProps,
} from "components/Modal/NetworkChangePromptModal";
import { DefaultSingleActionModalProps, SingleActionModalProps } from "components/Modal/SingleActionModal";
import { NotificationProps } from "components/Notifications/NotificationProps";
import React, { createContext, useReducer } from "react";
import { DefaultDualActionModalProps, DualActionModalProps } from "../components/Modal/DualActionModal";
import {} from "../components/Modal/SingleActionModal";
import {
  AppActions,
  CLEAR_NOTIFICATIONS,
  DUAL_ACTION_MODAL,
  DUAL_ACTION_WIDE_MODAL,
  HIDE_GLOBAL_LOADER,
  HIDE_NOTIFICATION,
  MOBILE_FULL_SCREEN_MODAL,
  MULTI_CHOICE_ACTION_MODAL,
  NETWORK_CHANGE_PROMPT_MODAL,
  PUSH_NOTIFICATION,
  SHOW_GLOBAL_LOADER,
  SINGLE_ACTION_MODAL,
  UNSET_NOTIFICATION,
} from "./actions";

interface DefaultState {
  notifications: NotificationProps[];
  mobileFullScreenModal: MobileFullScreenModalProps;
  singleActionModal: SingleActionModalProps;
  multiChoiceActionModal: MultiChoiceActionModalProps;
  dualActionModal: DualActionModalProps;
  networkChangePromptModal: NetworkChangePromptModalProps;
  dualActionWideModal: DualActionWideModalProps;
  globalLoaderVisible?: boolean;
}

const initialState: DefaultState = {
  notifications: [],
  mobileFullScreenModal: {
    ...DefaultMobileFullScreenModalProps,
  },
  singleActionModal: {
    ...DefaultSingleActionModalProps,
  },
  multiChoiceActionModal: {
    ...DefaultMultiChoiceActionModalProps,
  },
  networkChangePromptModal: {
    ...DefaultNetworkChangePromptModalProps,
  },
  dualActionModal: {
    ...DefaultDualActionModalProps,
  },
  dualActionWideModal: {
    ...DefaultDualActionWideModalProps,
  },
};

const store = createContext(
  initialState as unknown as {
    state: DefaultState;
    dispatch: React.Dispatch<any>;
  },
);
const { Provider } = store;

const StateProvider = ({ children }: { children: React.ReactElement }) => {
  const [state, dispatch] = useReducer((state: DefaultState, action: AppActions) => {
    switch (action.type) {
      case PUSH_NOTIFICATION:
        return {
          ...state,
          notifications: [...state.notifications, action.payload],
        };
      case HIDE_NOTIFICATION:
        return {
          ...state,
          notifications: [
            ...state.notifications.map((notification) => {
              if (notification.id == action.payload) {
                notification.visible = false;
              }
              return notification;
            }),
          ],
        };
      case UNSET_NOTIFICATION:
        return {
          ...state,
          notifications: [...state.notifications.filter((notification) => notification.id !== action.payload)],
        };
      case CLEAR_NOTIFICATIONS:
        return {
          ...state,
          notifications: [
            ...state.notifications.map((notification) => {
              notification.visible = false;
              return notification;
            }),
          ],
        };
      case MOBILE_FULL_SCREEN_MODAL:
        return {
          ...state,
          mobileFullScreenModal: {
            ...action.payload,
          },
        };
      case SINGLE_ACTION_MODAL:
        return {
          ...state,
          singleActionModal: {
            ...action.payload,
          },
        };
      case MULTI_CHOICE_ACTION_MODAL:
        return {
          ...state,
          multiChoiceActionModal: {
            ...action.payload,
          },
        };
      case NETWORK_CHANGE_PROMPT_MODAL:
        return {
          ...state,
          networkChangePromptModal: {
            ...action.payload,
          },
        };
      case DUAL_ACTION_MODAL:
        return {
          ...state,
          dualActionModal: {
            ...action.payload,
          },
        };
      case DUAL_ACTION_WIDE_MODAL:
        return {
          ...state,
          dualActionWideModal: {
            ...action.payload,
          },
        };
      case SHOW_GLOBAL_LOADER:
      case HIDE_GLOBAL_LOADER:
        return {
          ...state,
          globalLoaderVisible: action.payload,
        };
      default:
        return {
          ...state,
        };
    }
  }, initialState);

  return <Provider value={{ state, dispatch }}>{children}</Provider>;
};

export { store, StateProvider };
