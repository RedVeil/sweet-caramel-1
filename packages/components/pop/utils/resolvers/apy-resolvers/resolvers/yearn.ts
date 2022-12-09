import { BigNumber } from "ethers";
import { apy } from "@popcorn/components/pop/Yearn";

export const yearn = async (address, chainId, rpc): Promise<{ value: BigNumber; decimals: number }> => {
  return apy({ address, chainId, rpc });
};
