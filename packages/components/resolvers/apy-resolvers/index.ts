import { BigNumber } from "ethers";
import { ChainId } from "packages/utils";
import { synthetix } from "./synthetix";

export type ApyResolver = (
  address: string,
  chainId: ChainId,
  rpc?: any,
) => Promise<{ value: BigNumber; decimals: number }>;

export type ApyResolvers = Record<string, ApyResolver>;

export const ApyResolvers: ApyResolvers = {
  synthetix,
};

export default ApyResolvers;
