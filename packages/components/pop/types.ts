import { BigNumber } from "ethers";

export namespace Pop {
  export type BaseContractProps = Address & ChainId & Partial<Account & Enabled>;

  export type FC<T> = React.FC<FCProps<T> & T & Partial<HookResult<T>>>;

  export type FCProps<T> = BaseContractProps & T;

  export type HookResult<T = unknown> = UseQueryResult<T>;

  export type Hook<Props = BaseContractProps, T extends any = ReturnType<(...args: any) => unknown>> = (
    props: FCProps<Props> & Props,
  ) => HookResult<T>;

  export interface UseQueryResult<T> {
    data?: T;
    status: "idle" | "loading" | "success" | "error";
  }

  export interface Address {
    address: string;
  }
  export interface ChainId {
    chainId: number;
  }
  export interface Account {
    account: `0x${string}`;
  }
  export interface Enabled {
    enabled: boolean;
  }

  export interface Erc20Metadata {
    name: string;
    symbol: string;
    decimals: number;
  }

  export interface NamedAccountsMetadata {
    name?: string;
    symbol?: string;
    decimals?: number;
    isERC20?: boolean;
    priceResolver?: "staking" | "set_token" | "pop" | "univ3" | "arrakis";
    balanceResolver?: "escrowBalance";
    [key: string]: any;
  }
}

export interface BigNumberWithFormatted {
  value?: BigNumber;
  formatted?: string;
}
