import { ChainId, isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import YearnVault from "@popcorn/app/helper/YearnVault";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import useSWR, { SWRResponse } from "swr";

const PERCENT = 100;
const calculateApyForVaults = (vaults: YearnVault[], addresses: string[]) => {
  return (
    (addresses
      .map((address) => vaults.find((vault) => vault?.address === address)?.apy?.net_apy)
      .reduce((acc, curr) => acc + curr, 0) /
      addresses.length) *
    PERCENT
  );
};

async function getApyForYearnVaults(chainId: number, addresses: string[]): Promise<number | void> {
  if (chainId === ChainId.Localhost) chainId = ChainId.Ethereum;
  return fetch(`https://api.yearn.finance/v1/chains/${chainId}/vaults/all`)
    .then((res) => res.json())
    .then((vaults) => {
      return calculateApyForVaults(vaults, addresses);
    })
    .catch((ex) => {
      console.log("Error while fetching yearn vaults", ex.toString());
    });
}

export default function useGetYearnAPY(addresses: string[]): SWRResponse<number | void, Error> {
  const { chainId } = useWeb3();

  const shouldFetch = isButterSupportedOnCurrentNetwork(chainId);
  return useSWR(shouldFetch ? [chainId, addresses] : null, getApyForYearnVaults, {
    refreshInterval: 3 * 1000,
  });
}
