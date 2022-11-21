import { DualActionModalProps } from "@popcorn/app/components/Modal/DualActionModal";
import {
  DefaultDualActionWideModalProps,
  DualActionWideModalProps,
} from "@popcorn/app/components/Modal/DualActionWideModal";
import {
  DefaultMobileFullScreenModalProps,
  MobileFullScreenModalProps,
} from "@popcorn/app/components/Modal/MobileFullScreenModal";
import {
  DefaultMultiChoiceActionModalProps,
  MultiChoiceActionModalProps,
} from "@popcorn/app/components/Modal/MultiChoiceActionModal";
import {
  DefaultNetworkChangePromptModalProps,
  NetworkChangePromptModalProps,
} from "@popcorn/app/components/Modal/NetworkChangePromptModal";
import { DefaultSingleActionModalProps, SingleActionModalProps } from "@popcorn/app/components/Modal/SingleActionModal";
import { DefaultWalletSelectModalProps, WalletSelectModalProps } from "@popcorn/app/components/Modal/WalletSelectModal";
import { DefaultDualActionModalProps } from "@popcorn/app/components/Modal/DualActionModal";
import { NotificationProps } from "@popcorn/app/components/Notifications/NotificationProps";

export const PUSH_NOTIFICATION = "notifications/PUSH_NOTIFICATION";
export const UNSET_NOTIFICATION = "notifications/UNSET_NOTIFICATION";
export const HIDE_NOTIFICATION = "notifications/HIDE_NOTIFICATION";
export const CLEAR_NOTIFICATIONS = "notifications/CLEAR_NOTIFICATIONS";
export const NETWORK_CHANGE_PROMPT_MODAL = "modals/NETWORK_CHANGE_PROMPT_MODAL";
export const MOBILE_FULL_SCREEN_MODAL = "modals/MOBILE_FULL_SCREEN_MODAL";
export const SINGLE_ACTION_MODAL = "modals/SINGLE_ACTION_MODAL";
export const WALLET_SELECT_MODAL = "modals/WALLET_SELECT_MODAL";
export const MULTI_CHOICE_ACTION_MODAL = "modals/MULTI_CHOICE_ACTION_MODAL";
export const DUAL_ACTION_MODAL = "modals/DUAL_ACTION_MODAL";
export const DUAL_ACTION_WIDE_MODAL = "modals/DUAL_ACTION_WIDE_MODAL";
export const SHOW_GLOBAL_LOADER = "ui/SHOW_GLOBAL_LOADER";
export const HIDE_GLOBAL_LOADER = "ui/HIDE_GLOBAL_LOADER";

export const UPDATE_STAKING_PAGE_INFO = "staking/UPDATE_STAKING_PAGE_INFO";

export type AppActions =
  | PushNotificationAction
  | UnsetNotificationAction
  | HideNotificationAction
  | SetNetworkChangePromptModalAction
  | ClearNotificationsAction
  | SetMobileFullScreenModalAction
  | SetSingleActionModalAction
  | SetWalletSelectModalAction
  | SetDualActionModalAction
  | SetDualActionWideModalAction
  | SetMultiChoiceActionModalAction
  | ShowGlobalLoaderAction;

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
export const pushNotification = (notification: Partial<Notification>): PushNotificationAction => {
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

export interface SetMobileFullScreenModalAction {
  type: typeof MOBILE_FULL_SCREEN_MODAL;
  payload: MobileFullScreenModalProps;
}

export const setMobileFullScreenModal = (
  props: Partial<MobileFullScreenModalProps> | false,
): SetMobileFullScreenModalAction => {
  if (!props) {
    return {
      type: MOBILE_FULL_SCREEN_MODAL,
      payload: {
        ...DefaultMobileFullScreenModalProps,
        visible: false,
      },
    };
  }
  return {
    type: MOBILE_FULL_SCREEN_MODAL,
    payload: {
      ...DefaultMobileFullScreenModalProps,
      visible: true,
      ...props,
    },
  };
};
export interface SetNetworkChangePromptModalAction {
  type: typeof NETWORK_CHANGE_PROMPT_MODAL;
  payload: NetworkChangePromptModalProps;
}

export const setNetworkChangePromptModal = (props: Partial<NetworkChangePromptModalProps> | false) => {
  if (!props) {
    return {
      type: NETWORK_CHANGE_PROMPT_MODAL,
      payload: {
        ...DefaultNetworkChangePromptModalProps,
        visible: false,
      },
    };
  }
  return {
    type: NETWORK_CHANGE_PROMPT_MODAL,
    payload: {
      ...DefaultNetworkChangePromptModalProps,
      visible: true,
      ...props,
    },
  };
};

export interface SetSingleActionModalAction {
  type: typeof SINGLE_ACTION_MODAL;
  payload: SingleActionModalProps;
}

export const setSingleActionModal = (props: Partial<SingleActionModalProps> | false): SetSingleActionModalAction => {
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

export interface SetWalletSelectModalAction {
  type: typeof WALLET_SELECT_MODAL;
  payload: WalletSelectModalProps;
}

export const setWalletSelectModal = (props: Partial<WalletSelectModalProps> | false): SetWalletSelectModalAction => {
  if (!props) {
    return {
      type: WALLET_SELECT_MODAL,
      payload: {
        ...DefaultWalletSelectModalProps,
        visible: false,
      },
    };
  }
  return {
    type: WALLET_SELECT_MODAL,
    payload: {
      ...DefaultWalletSelectModalProps,
      visible: true,
      ...props,
    },
  };
};

export interface SetMultiChoiceActionModalAction {
  type: typeof MULTI_CHOICE_ACTION_MODAL;
  payload: MultiChoiceActionModalProps;
}

export const setMultiChoiceActionModal = (
  props: Partial<MultiChoiceActionModalProps> | false,
): SetMultiChoiceActionModalAction => {
  if (!props) {
    return {
      type: MULTI_CHOICE_ACTION_MODAL,
      payload: {
        ...DefaultMultiChoiceActionModalProps,
        visible: false,
      },
    };
  }
  return {
    type: MULTI_CHOICE_ACTION_MODAL,
    payload: {
      ...DefaultMultiChoiceActionModalProps,
      visible: true,
      ...props,
    },
  };
};

export interface SetDualActionModalAction {
  type: typeof DUAL_ACTION_MODAL;
  payload: DualActionModalProps;
}
export const setDualActionModal = (props: Partial<DualActionModalProps> | false): SetDualActionModalAction => {
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
