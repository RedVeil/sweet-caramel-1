import { parseEther } from "ethers/lib/utils";
import defi_llama from "./llama";
import { set_token } from "./set-token";
import { staking } from "./staking";
import { arrakis } from "./arrakis";
import { pop } from "./pop";

export const Resolvers = {
  defillama: async function (address, chainId) {
    return defi_llama(address, chainId);
  },
  setToken: async function (address, chainId, rpc) {
    return set_token(address, chainId, rpc);
  },
  staking: async function (address, chainId, rpc) {
    return staking(address, chainId, rpc, this);
  },
  pop: async function () {
    return pop();
  },
  arrakis: async function (address, chainId, rpc) {
    return arrakis(address, chainId, rpc, this);
  }, // todo
  vault: async function (address, chainId) {
    return parseEther("1");
  }, // todo
};
