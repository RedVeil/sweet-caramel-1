import React from 'react';
import { Notification } from '../app/store';
import { Link } from '@material-ui/core';
import {
  SingleActionModalProps,
  DefaultSingleActionModalProps,
} from 'components/Modal/SingleActionModal';
import { DualActionModalProps } from 'components/Modal/DualActionModal';
import { DefaultDualActionModalProps } from '../components/Modal/DualActionModal';

export const DISPLAY_NOTIFICATION = 'notifications/DISPLAY_NOTIFICATION';
export const TOGGLE_NOTIFICATION = 'notifications/TOGGLE_NOTIFICATION';
export const SINGLE_ACTION_MODAL = 'modals/SINGLE_ACTION_MODAL';
export const DUAL_ACTION_MODAL = 'modals/DUAL_ACTION_MODAL';

export type AppActions =
  | DisplayNotificationAction
  | ToggleNotificationAction
  | SetSingleActionModalAction
  | SetDualActionModalAction;

export interface DisplayNotificationAction {
  type: typeof DISPLAY_NOTIFICATION;
  payload: Notification;
}
export const displayNotification = (
  notification: Partial<Notification>,
): DisplayNotificationAction => {
  return {
    type: DISPLAY_NOTIFICATION,
    payload: { ...notification, visible: true } as Notification,
  };
};

export interface ToggleNotificationAction {
  type: typeof TOGGLE_NOTIFICATION;
}
export const toggleNotification = (): ToggleNotificationAction => {
  return {
    type: TOGGLE_NOTIFICATION,
  };
};

export const showPaywall = (): DisplayNotificationAction => {
  return displayNotification({
    backdrop: true,
    isFlash: false,
    visible: true,
    type: 'info',
    content: (
      <div>
        Sorry, that feature is only available for{' '}
        <Link href="/modals/4">premium members</Link>.
      </div>
    ),
  });
};

export interface SetSingleActionModalAction {
  type: typeof SINGLE_ACTION_MODAL;
  payload: SingleActionModalProps;
}

export const setSingleActionModal = (
  props: Partial<SingleActionModalProps> | false,
): SetSingleActionModalAction => {
  if (!props) {
    return {
      type: SINGLE_ACTION_MODAL,
      payload: {
        ...DefaultSingleActionModalProps,
        visible: false,
      },
    };
  }
  return {
    type: SINGLE_ACTION_MODAL,
    payload: {
      ...DefaultSingleActionModalProps,
      visible: true,
      ...props,
    },
  };
};

export interface SetDualActionModalAction {
  type: typeof DUAL_ACTION_MODAL;
  payload: DualActionModalProps;
}
export const setDualActionModal = (
  props: Partial<DualActionModalProps>| false,
): SetDualActionModalAction => {
  if (!props) {
    return {
      type: DUAL_ACTION_MODAL,
      payload: {
        ...DefaultDualActionModalProps,
        visible: false,
      },
    };
  }
  return {
    type: DUAL_ACTION_MODAL,
    payload: {
      ...DefaultDualActionModalProps,
      visible: true,
      ...props,
    },
  };
};
