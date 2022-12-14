import { Dispatch } from "react";
import { BigNumber } from "ethers";

export type Status = "loading" | "success" | "error" | "idle";

export enum NetworthActionType {
  UPDATE_NETWORTH = "UPDATE_NETWORTH",
  UPDATE_POP_BALANCE = "UPDATE_POP_BALANCE",
}

interface UpdateNetworth {
  type: NetworthActionType.UPDATE_NETWORTH;
  payload: {
    key: string;
    value: BigNumber;
    status: Status;
  };
}
interface UpdatePopBalance {
  type: NetworthActionType.UPDATE_POP_BALANCE;
  payload: {
    value: BigNumber;
    status: Status;
  };
}

export type NetworthActions = UpdateNetworth | UpdatePopBalance | { type: null };

export const updateNetworth =
  (payload: { key: string; value: BigNumber; status: Status }) => (dispatch: Dispatch<NetworthActions>) => {
    dispatch({
      type: NetworthActionType.UPDATE_NETWORTH,
      payload: { ...payload },
    });
  };

export const updatePopInWallet =
  (payload: { value: BigNumber; status: Status }) => (dispatch: Dispatch<NetworthActions>) => {
    dispatch({
      type: NetworthActionType.UPDATE_POP_BALANCE,
      payload: { ...payload },
    });
  };
