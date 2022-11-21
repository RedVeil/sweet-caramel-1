import { ChainId } from "@popcorn/utils";

export function useChainsWithStaking(): ChainId[] {
  return [ChainId.ALL, ChainId.Ethereum, ChainId.Polygon, ChainId.Localhost].filter((chain) =>
    process.env.IS_DEV === "TRUE" ? true : chain !== ChainId.Localhost,
  );
}

export function useChainsWithStakingRewards(): ChainId[] {
  return [ChainId.ALL, ChainId.Ethereum, ChainId.Polygon, ChainId.BNB, ChainId.Arbitrum, ChainId.Localhost].filter(
    (chain) => (process.env.IS_DEV === "TRUE" ? true : chain !== ChainId.Localhost),
  );
}
