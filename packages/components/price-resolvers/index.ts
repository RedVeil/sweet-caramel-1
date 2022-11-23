import { parseEther } from "ethers/lib/utils";
import defi_llama from "./llama";
import { set_token } from "./set-token";
import { staking } from "./staking";
import { arrakis } from "./arrakis";
import { pop } from "./pop";
import { BigNumber } from "ethers";
import { Provider } from "@wagmi/core";

type Resolvers = { [key: string]: Resolver };

type Resolver = (
  address: string,
  chainId: number,
  rpc?: Provider,
  resolvers?: Resolvers,
) => Promise<{ value: BigNumber; decimals: number }>;

export const Resolvers: Resolvers = {
  defillama: async function (address: string, chainId: number) {
    return defi_llama(address, chainId);
  },
  setToken: async function (address: string, chainId: number, rpc?: Provider) {
    return set_token(address, chainId, rpc);
  },
  staking: async function (address: string, chainId: number, rpc?: Provider) {
    return staking(address, chainId, rpc, this);
  },
  pop: async function () {
    return pop();
  },
  arrakis: async function (address, chainId, rpc) {
    return arrakis(address, chainId, rpc, this);
  },
};
