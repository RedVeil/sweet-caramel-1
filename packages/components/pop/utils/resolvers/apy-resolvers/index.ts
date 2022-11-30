import { BigNumber } from "ethers";
import { ChainId } from "@popcorn/utils";
import { synthetix } from "./synthetix";

export type ApyResolver = (
  address: string,
  chainId: ChainId,
  rpc?: any,
) => Promise<{ value: BigNumber; formatted: number }>;

export type ApyResolvers = typeof ApyResolvers;

export const ApyResolvers = {
  synthetix,
  default: synthetix,
};

export default ApyResolvers;
