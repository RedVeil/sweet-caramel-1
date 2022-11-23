import { DefaultSingleActionModalProps } from 'components/Modal/SingleActionModal';
import React, { createContext, useReducer } from 'react';
import { SingleActionModalProps } from '../components/Modal/SingleActionModal';
import { DefaultDualActionModalProps, DualActionModalProps } from '../components/Modal/DualActionModal';
import {
  AppActions,
  DISPLAY_NOTIFICATION,
  TOGGLE_NOTIFICATION,
  SINGLE_ACTION_MODAL,
  DUAL_ACTION_MODAL,
} from './actions';

export interface Notification {
  visible: boolean;
  type: 'info' | 'warn';
  isFlash?: boolean;
  content: React.ReactElement;
  backdrop?: boolean;
}


interface DefaultState {
  notifications: Notification;
  singleActionModal: SingleActionModalProps;
  dualActionModal: DualActionModalProps;
}

const initialState: DefaultState = {
  notifications: {
    visible: false,
    type: 'info',
    content: <></>,
    isFlash: false,
    backdrop: false,
  },
  singleActionModal: {
    ...DefaultSingleActionModalProps,
  },
  dualActionModal: {
    ...DefaultDualActionModalProps,
  }
};

const store = createContext(
  (initialState as unknown) as {
    state: DefaultState;
    dispatch: React.Dispatch<any>;
  },
);
const { Provider } = store;

const StateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(
    (state: DefaultState, action: AppActions) => {
      switch (action.type) {
        case DISPLAY_NOTIFICATION:
          return {
            ...state,
            notifications: action.payload,
          };
        case TOGGLE_NOTIFICATION:
          return {
            ...state,
            notifications: {
              ...state.notifications,
              visible: !state.notifications.visible,
            },
          };
        case SINGLE_ACTION_MODAL:
          return {
            ...state,
            singleActionModal: {
                ...action.payload
            }
          }
        case DUAL_ACTION_MODAL:
          return {
            ...state,
            dualActionModal: {
                ...action.payload
            }
          }
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
