import { ChainId } from "@popcorn/utils";
import { BigNumber } from "ethers";

const UPDATE_TOKEN = "UPDATE_TOKEN";
const UPDATE_WALLET = "UPDATE_WALLET";
const UPDATE_NETWORTH = "UPDATE_NETWORTH";
const RESET = "RESET";

export interface UpdateTokenActionProps {
  chainId: ChainId;
  token: string;
  price?: { value: BigNumber; decimals: number };
  isLoading?: boolean;
  error?: boolean;
}

interface UpdateTokenAction {
  type: typeof UPDATE_TOKEN;
  payload: UpdateTokenActionProps;
}
export type UpdateTokenActionCreator = (args: UpdateTokenActionProps) => UpdateTokenAction;

export const updateToken: UpdateTokenActionCreator = ({ chainId, token, isLoading, price, error }) => {
  return { type: UPDATE_TOKEN, payload: { chainId, token, isLoading, price, error } };
};

export interface UpdateWalletBalanceActionProps {
  chainId: ChainId;
  account: string;
  token: string;
  balance?: BigNumber;
  hasBalance?: boolean;
  value?: BigNumber;
  isLoading?: boolean;
  isError?: boolean;
  error?: string;
}

export type UpdateWalletActionCreator = (args: UpdateWalletBalanceActionProps) => UpdateWalletAction;

interface UpdateWalletAction {
  type: typeof UPDATE_WALLET;
  payload: UpdateWalletBalanceActionProps;
}
export const updateWallet: UpdateWalletActionCreator = ({
  chainId,
  account,
  token,
  balance,
  hasBalance,
  value,
  isLoading,
  isError,
  error,
}) => {
  return {
    type: UPDATE_WALLET,
    payload: { chainId, account, token, balance, hasBalance, value, isLoading, isError, error },
  };
};

export interface UpdateNetworthActionProps {
  account: string;
  value?: BigNumber;
  isLoading?: boolean;
  error?: boolean;
}

interface UpdateNetworthAction {
  type: typeof UPDATE_NETWORTH;
  payload: UpdateNetworthActionProps;
}

export type UpdateNetworthActionCreator = (args: UpdateNetworthActionProps) => UpdateNetworthAction;

export const updateNetworth: UpdateNetworthActionCreator = ({ account, value, isLoading, error }) => {
  return {
    type: UPDATE_NETWORTH,
    payload: { account, value, isLoading, error },
  };
};

export const reset = () => {
  return { type: RESET };
};
