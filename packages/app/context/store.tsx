import {
  DefaultDualActionWideModalProps,
  DualActionWideModalProps,
} from 'components/Modal/DualActionWideModal';
import { DefaultSingleActionModalProps } from 'components/Modal/SingleActionModal';
import { NotificationProps } from 'components/Notifications/NotificationProps';
import { StakingPageInfo } from 'pages/staking/[id]';
import React, { createContext, useReducer } from 'react';
import {
  DefaultDualActionModalProps,
  DualActionModalProps,
} from '../components/Modal/DualActionModal';
import { SingleActionModalProps } from '../components/Modal/SingleActionModal';
import {
  AppActions,
  CLEAR_NOTIFICATIONS,
  DUAL_ACTION_MODAL,
  DUAL_ACTION_WIDE_MODAL,
  HIDE_GLOBAL_LOADER,
  HIDE_NOTIFICATION,
  PUSH_NOTIFICATION,
  SHOW_GLOBAL_LOADER,
  SINGLE_ACTION_MODAL,
  UNSET_NOTIFICATION,
  UPDATE_STAKING_PAGE_INFO,
} from './actions';

interface DefaultState {
  notifications: NotificationProps[];
  singleActionModal: SingleActionModalProps;
  dualActionModal: DualActionModalProps;
  dualActionWideModal: DualActionWideModalProps;
  stakingPageInfo?: StakingPageInfo;
  globalLoaderVisible?: boolean;
}

const initialState: DefaultState = {
  notifications: [],
  singleActionModal: {
    ...DefaultSingleActionModalProps,
  },
  dualActionModal: {
    ...DefaultDualActionModalProps,
  },
  dualActionWideModal: {
    ...DefaultDualActionWideModalProps,
  },
  stakingPageInfo: undefined,
};

const store = createContext(
  initialState as unknown as {
    state: DefaultState;
    dispatch: React.Dispatch<any>;
  },
);
const { Provider } = store;

const StateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(
    (state: DefaultState, action: AppActions) => {
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
            notifications: [
              ...state.notifications.filter(
                (notification) => notification.id !== action.payload,
              ),
            ],
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
        case SINGLE_ACTION_MODAL:
          return {
            ...state,
            singleActionModal: {
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
        case UPDATE_STAKING_PAGE_INFO:
          return {
            ...state,
            stakingPageInfo: {
              ...action.payload,
            },
          };
        case UPDATE_STAKING_PAGE_INFO:
          return {
            ...state,
            stakingPageInfo: {
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
    },
    initialState,
  );

  return <Provider value={{ state, dispatch }}>{children}</Provider>;
};

export { store, StateProvider };
