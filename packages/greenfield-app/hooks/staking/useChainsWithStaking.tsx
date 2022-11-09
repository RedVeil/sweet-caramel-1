import { ChainId } from "@popcorn/utils";

export default function useChainsWithStaking(): ChainId[] {
  return [ChainId.Ethereum, ChainId.Polygon, ChainId.Localhost].filter(chain => process.env.IS_DEV ? true : chain !== ChainId.Localhost)

}