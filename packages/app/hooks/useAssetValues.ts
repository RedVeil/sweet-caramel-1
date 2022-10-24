import { networkMap } from "@popcorn/hardhat/lib/utils/constants";
import useSWR, { SWRResponse } from "swr";

export default function useAssetValues(
  chainId: number,
  addresses: string[],
): SWRResponse<{
  [x: string]: number;
}> {
  const chainString = (chainId = 1337 ? "ethereum" : networkMap[chainId].toLowerCase());
  const shouldFetch = addresses.length > 0 && addresses[0] !== undefined;

  return useSWR(shouldFetch ? ["assetValue", chainString, addresses] : null, async () => {
    const queryString = addresses
      .map((address) => `${chainString}:${address}`)
      .reduce((query, address) => query.concat(`,${address}`));

    const url = `https://coins.llama.fi/prices/current/${queryString}`;

    const result = await fetch(url);
    const parsed = await result.json();
    return addresses
      .map((address) => ({
        [address]: parsed.coins[`${chainString}:${address}`]?.price,
      }))
      .reduce((accumulated, current) => ({ ...accumulated, ...current }));
  });
}
