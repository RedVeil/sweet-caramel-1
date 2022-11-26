import { ChainId } from "@popcorn/utils";
import { BigNumber } from "ethers";
import { UPDATE_TOKEN, UPDATE_WALLET } from "./actions";

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
        [token: string]: PortfolioToken;
      };
    };
  };
}

export interface AsyncState {
  isLoading?: boolean;
  error?: Error | null;
  isError?: boolean;
}
export type PortfolioTokenAsyncProperty<Property = undefined> = {
  data?: Property;
} & AsyncState;

export interface Decimals {
  decimals?: number;
}

export interface Name {
  name?: string;
}

export interface Symbol {
  symbol?: string;
}
export type Erc20 = Decimals & Name & Symbol;
export interface BigNumberWithFormatted {
  value?: BigNumber;
  formatted?: string;
}
export interface PortfolioToken {
  address: string;
  chainId: ChainId;
  alias?: string;
  symbol?: string;
  isLoading?: boolean;
  hasBalance?: boolean;
  isValidating?: boolean;
  priceResolver?: string;
  icons?: string[];
  error?: Error | null;
  isError?: boolean;
  asErc20?: PortfolioTokenAsyncProperty<Erc20>;
  balance?: PortfolioTokenAsyncProperty<BigNumberWithFormatted>;
  balanceValue?: PortfolioTokenAsyncProperty<BigNumberWithFormatted>;
  apy?: PortfolioTokenAsyncProperty<BigNumberWithFormatted>;
  price?: PortfolioTokenAsyncProperty<BigNumberWithFormatted & Decimals>;
  tvl?: PortfolioTokenAsyncProperty<BigNumberWithFormatted>;
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
    case UPDATE_TOKEN: {
      const { chainId, address, isLoading, error, isError, ...props } = action.payload;
      if (!!!chainId || !!!address) return { ...state };
      return {
        ...state,
        tokens: {
          ...state.tokens,
          [chainId]: {
            ...state.tokens?.[chainId],
            [address]: {
              ...state.tokens?.[chainId]?.[address],
              ...props,
              address,
              chainId,
              isLoading,
              error,
              isError,
            },
          },
        },
      };
    }
    case UPDATE_WALLET: {
      const { chainId, account, token, ...props } = action.payload;
      if (!account && !chainId && !token) return { ...state };
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
                ...props,
              },
            },
          },
        },
      };
    }
    default:
      return { ...state };
  }
};
