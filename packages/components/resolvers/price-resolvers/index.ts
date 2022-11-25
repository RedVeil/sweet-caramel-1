import { PriceResolvers } from "./types";

export * from "./types";
//export * from "./Resolvers";
import { defi_llama, set_token, staking, pop, arrakis, univ2 } from "./resolvers";

export const Resolvers: PriceResolvers = {
  defi_llama,
  set_token,
  staking,
  pop,
  arrakis,
  univ2,
};
