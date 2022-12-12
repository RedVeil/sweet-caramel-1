import { BigNumber } from "ethers";
import { NetworthActions, NetworthActionType } from "./actions";

type Status = "loading" | "success" | "error" | "idle";

export interface NetworthState {
  [key: string]: { value: BigNumber; status: Status };
}

export const initialState: NetworthState = {};

export const networthReducer = (state = initialState, action: NetworthActions = { type: null }) => {
  switch (action.type) {
    case NetworthActionType.UPDATE_NETWORTH: {
      return {
        ...state,
        //@ts-ignore TODO: fix this
        [action.payload.key]: {
          //@ts-ignore TODO: fix this
          value: action.payload.value,
          //@ts-ignore TODO: fix this
          status: action.payload.status,
        },
      };
    }
    default:
      return state;
  }
};
