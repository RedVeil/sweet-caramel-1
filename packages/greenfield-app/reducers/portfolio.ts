import { ChainId } from "@popcorn/utils";
import { BigNumber } from "ethers";

export interface PortfolioState {
  tokens: {
    [chainId: string]: {
      [address: string]: {
        price?: { value: BigNumber; decimals: number };
        isLoading?: boolean;
        error?: boolean;
        address?: string;
      };
    };
  };
  networth: {
    [account: string]: { value: BigNumber; isLoading?: boolean; error?: boolean };
  };
  wallet: {
    [chainId: string]: {
      [account: string]: {
        [token: string]: {
          hasBalance?: boolean;
          isLoading?: boolean;
          isError?: boolean;
          error?: string;
          balance?: BigNumber;
          value?: BigNumber;
          lastUpdated?: number;
        };
      };
    };
  };
}

export type PortfolioToken = PortfolioState["tokens"][0][0];

export const DefaultState = {
  tokens: {
    [`${ChainId.Arbitrum}`]: {},
    [`${ChainId.BNB}`]: {},
    [`${ChainId.Ethereum}`]: {},
    [`${ChainId.Goerli}`]: {},
    [`${ChainId.Localhost}`]: {},
    [`${ChainId.Optimism}`]: {},
    [`${ChainId.Polygon}`]: {},
  },
  wallet: {
    [`${ChainId.Arbitrum}`]: {},
    [`${ChainId.BNB}`]: {},
    [`${ChainId.Ethereum}`]: {},
    [`${ChainId.Goerli}`]: {},
    [`${ChainId.Localhost}`]: {},
    [`${ChainId.Optimism}`]: {},
    [`${ChainId.Polygon}`]: {},
  },
};

export const reducer = (state, action) => {
  switch (action.type) {
    case "RESET":
      return { ...DefaultState };
    case "UPDATE_NETWORTH": {
      const { account, value, isLoading, error } = action.payload;
      return { ...state, networth: { ...state.networth, [account]: { value, isLoading, error } } };
    }
    case "UPDATE_TOKEN": {
      const { chainId, token, price, isLoading, error } = action.payload;
      return {
        ...state,
        tokens: {
          ...state.tokens,
          [chainId]: {
            ...state.tokens?.[chainId],
            [token]: {
              price,
              isLoading,
              error,
              address: token,
            },
          },
        },
      };
    }
    case "UPDATE_WALLET": {
      const { chainId, account, token, balance, hasBalance, value, isLoading, error, isError } = action.payload;
      return {
        ...state,
        wallet: {
          ...state.wallet,
          [chainId]: {
            ...state.wallet?.[chainId],
            [account]: {
              ...state.wallet?.[chainId]?.[account],
              [token]: {
                ...state.wallet?.[chainId]?.[account]?.[token],
                balance,
                hasBalance,
                value,
                isLoading,
                error,
                isError,
              },
            },
          },
        },
      };
    }
    default:
      return state;
  }
};

export interface UpdateTokenActionProps {
  chainId: ChainId;
  token: string;
  price?: { value: BigNumber; decimals: number };
  isLoading?: boolean;
  error?: boolean;
}

interface UpdateTokenAction {
  type: "UPDATE_TOKEN";
  payload: UpdateTokenActionProps;
}
export type UpdateTokenActionCreator = (args: UpdateTokenActionProps) => UpdateTokenAction;

export const updateToken: UpdateTokenActionCreator = ({ chainId, token, isLoading, price, error }) => {
  return { type: "UPDATE_TOKEN", payload: { chainId, token, isLoading, price, error } };
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
  type: "UPDATE_WALLET";
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
    type: "UPDATE_WALLET",
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
  type: "UPDATE_NETWORTH";
  payload: UpdateNetworthActionProps;
}

interface UpdateNetworthAction {
  type: "UPDATE_NETWORTH";
  payload: UpdateNetworthActionProps;
}

export type UpdateNetworthActionCreator = (args: UpdateNetworthActionProps) => UpdateNetworthAction;

export const updateNetworth: UpdateNetworthActionCreator = ({ account, value, isLoading, error }) => {
  return {
    type: "UPDATE_NETWORTH",
    payload: { account, value, isLoading, error },
  };
};

export const reset = () => {
  return { type: "RESET" };
};
