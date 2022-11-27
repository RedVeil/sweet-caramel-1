import { BigNumber } from "ethers";

export namespace Pop {
  export type BaseContractProps = Address & ChainId & Partial<Account & Enabled>;

  export type WagmiFC<T> = React.FC<WagmiFCProps<T>>;

  export type WagmiFCProps<T> = BaseContractProps & Partial<UseQueryResult<T>>;

  export type WagmiHookResult<T = undefined> = UseQueryResult<T>;

  // todo: infer R and P from the input given that it must also extend BaseContractProps
  export type WagmiHook<R, P extends BaseContractProps = BaseContractProps> = (
    props: P extends BaseContractProps ? P & BaseContractProps : P,
  ) => WagmiHookResult<R>;

  export interface UseQueryResult<T> {
    data: T | undefined;
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
}

export interface BigNumberWithFormatted {
  value?: BigNumber;
  formatted?: string;
}
