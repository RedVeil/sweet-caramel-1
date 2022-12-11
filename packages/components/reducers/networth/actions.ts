import { Dispatch } from "react";
import { BigNumber } from "ethers";

export type Status = "loading" | "success" | "error" | "idle";

export enum NetworthActionType {
  UPDATE_NETWORTH = "UPDATE_NETWORTH",
}

interface UpdateNetworth {
  type: NetworthActionType.UPDATE_NETWORTH;
  payload: {
    key: string;
    value: BigNumber;
    status: Status;
  };
}

export type NetworthActions = UpdateNetworth | { type: null };

export const updateNetworth =
  (payload: { key: string; value: BigNumber; status: Status }) => (dispatch: Dispatch<NetworthActions>) => {
    dispatch({
      type: NetworthActionType.UPDATE_NETWORTH,
      payload: { ...payload },
    });
  };
