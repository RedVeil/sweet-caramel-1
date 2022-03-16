import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "hooks/useWeb3";
import useSWR, { SWRResponse } from "swr";

const getAPYFromYearnVaults = (vaults) => {
  const crvFraxVault = vaults.find((vault) => vault?.token?.address === "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B"); // crvFRAX
  const crvMIMVault = vaults.find(
    (vault) => vault?.token?.address === "0x5a6A4D54456819380173272A5E8E9B9904BdF41B", // crvMIM
  );
  const totalNetAPY = crvFraxVault?.apy?.net_apy + crvMIMVault?.apy?.net_apy;
  const popcornProtocolFee = 1.5
  return (totalNetAPY / 2) * 100 * ((100 - popcornProtocolFee / 100));
};

const fetcher = async (key) => {
  return fetch("https://api.yearn.finance/v1/chains/1/vaults/all")
    .then((res) => res.json())
    .then((vaults) => {
      return getAPYFromYearnVaults(vaults);
    })
    .catch((ex) => {
      console.log("Error while fetching yearn vaults", ex.toString());
    });
};

export default function useGetButterAPY(): SWRResponse<number | void, Error> {
  const { chainId } = useWeb3();

  const shouldFetch = isButterSupportedOnCurrentNetwork(chainId);
  return useSWR(shouldFetch ? [`yearn-vaults`, chainId] : null, fetcher);
}
