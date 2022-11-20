import { ChainId } from "@popcorn/utils";
import { BigNumber } from "ethers";

export interface PortfolioState {
  tokens: {
    [chainId: string]: {
      [address: string]: PortfolioToken;
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

export interface PortfolioToken {
  price?: { value: BigNumber; decimals: number };
  isLoading?: boolean;
  error?: boolean;
  address?: string;
}

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
