import { ChainId } from "@popcorn/utils";
import { BigNumber } from "ethers";

export type PriceResolver = (address: string, chainId: ChainId) => Promise<{ value: BigNumber; decimals: number }>;
