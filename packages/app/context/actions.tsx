import { DualActionModalProps } from 'components/Modal/DualActionModal';
import {
  DefaultDualActionWideModalProps,
  DualActionWideModalProps,
} from 'components/Modal/DualActionWideModal';
import {
  DefaultSingleActionModalProps,
  SingleActionModalProps,
} from 'components/Modal/SingleActionModal';
import { StakingPageInfo } from 'pages/staking/[id]';
import { DefaultDualActionModalProps } from '../components/Modal/DualActionModal';
import { NotificationProps } from '../components/Notifications/NotificationProps';

export const PUSH_NOTIFICATION = 'notifications/PUSH_NOTIFICATION';
export const UNSET_NOTIFICATION = 'notifications/UNSET_NOTIFICATION';
export const HIDE_NOTIFICATION = 'notifications/HIDE_NOTIFICATION';
export const CLEAR_NOTIFICATIONS = 'notifications/CLEAR_NOTIFICATIONS';
export const SINGLE_ACTION_MODAL = 'modals/SINGLE_ACTION_MODAL';
export const DUAL_ACTION_MODAL = 'modals/DUAL_ACTION_MODAL';
export const DUAL_ACTION_WIDE_MODAL = 'modals/DUAL_ACTION_WIDE_MODAL';
export const SHOW_GLOBAL_LOADER = 'ui/SHOW_GLOBAL_LOADER';
export const HIDE_GLOBAL_LOADER = 'ui/HIDE_GLOBAL_LOADER';

export const UPDATE_STAKING_PAGE_INFO = 'staking/UPDATE_STAKING_PAGE_INFO';

export type AppActions =
  | PushNotificationAction
  | UnsetNotificationAction
  | HideNotificationAction
  | ClearNotificationsAction
  | SetSingleActionModalAction
  | SetDualActionModalAction
  | SetDualActionWideModalAction
  | ShowGlobalLoaderAction
  | UpdateStakingInfoAction;

export interface UpdateStakingInfoAction {
  type: typeof UPDATE_STAKING_PAGE_INFO;
  payload: StakingPageInfo;
}

export const updateStakingPageInfo = (
  stakingInfo: StakingPageInfo | undefined,
): UpdateStakingInfoAction => {
  return {
    type: UPDATE_STAKING_PAGE_INFO,
    payload: stakingInfo,
  };
};

export interface ShowGlobalLoaderAction {
  type: typeof SHOW_GLOBAL_LOADER | typeof HIDE_GLOBAL_LOADER;
  payload: boolean;
}

export const showGlobalLoader = (): ShowGlobalLoaderAction => {
  return {
    type: SHOW_GLOBAL_LOADER,
    payload: true,
  };
};

export const hideGlobalLoader = (): ShowGlobalLoaderAction => {
  return {
    type: HIDE_GLOBAL_LOADER,
    payload: false,
  };
};

export interface PushNotificationAction {
  type: typeof PUSH_NOTIFICATION;
  payload: NotificationProps;
}
export const pushNotification = (
  notification: Partial<Notification>,
): PushNotificationAction => {
  return {
    type: PUSH_NOTIFICATION,
    payload: { ...notification, visible: true } as NotificationProps,
  };
};

export interface UnsetNotificationAction {
  type: typeof UNSET_NOTIFICATION;
  payload: number;
}

export const unsetNotification = (id: number): UnsetNotificationAction => {
  return {
    type: UNSET_NOTIFICATION,
    payload: id,
  };
};

export interface HideNotificationAction {
  type: typeof HIDE_NOTIFICATION;
  payload: number;
}
export const hideNotification = (id: number): HideNotificationAction => {
  return {
    type: HIDE_NOTIFICATION,
    payload: id,
  };
};

export interface ClearNotificationsAction {
  type: typeof CLEAR_NOTIFICATIONS;
}

export const clearNotifications = (): ClearNotificationsAction => {
  return {
    type: CLEAR_NOTIFICATIONS,
  };
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
  props: Partial<DualActionModalProps> | false,
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

export interface SetDualActionWideModalAction {
  type: typeof DUAL_ACTION_WIDE_MODAL;
  payload: DualActionWideModalProps;
}
export const setDualActionWideModal = (
  props: Partial<DualActionWideModalProps> | false,
): SetDualActionWideModalAction => {
  if (!props) {
    return {
      type: DUAL_ACTION_WIDE_MODAL,
      payload: {
        ...DefaultDualActionWideModalProps,
        visible: false,
      },
    };
  }
  return {
    type: DUAL_ACTION_WIDE_MODAL,
    payload: {
      ...DefaultDualActionWideModalProps,
      visible: true,
      ...props,
    },
  };
};
