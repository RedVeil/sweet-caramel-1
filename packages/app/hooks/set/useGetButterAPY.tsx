import { isButterSupportedOnCurrentNetwork } from "@popcorn/utils";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import useSWR, { SWRResponse } from "swr";

const getAPYFromYearnVaults = (vaults) => {
  const crvFrax = "0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B";
  const crvRai = "0x6BA5b4e438FA0aAf7C1bD179285aF65d13bD3D90";
  const crvMusd = "0x1AEf73d49Dedc4b1778d0706583995958Dc862e6";
  const crvAlusd = "0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c";
  const crvFraxVault = vaults.find((vault) => vault?.token?.address === crvFrax);
  const crvRaiVault = vaults.find((vault) => vault?.token?.address === crvRai);
  const crvMusdVault = vaults.find((vault) => vault?.token?.address === crvMusd);
  const crvAlusdVault = vaults.find((vault) => vault?.token?.address === crvAlusd);

  // Currently Rai doesnt have an apy on yearn.
  // I compared convex apy of rai to another convex vault which has an apy on yearn (ibEUR)
  // Since both hade pretty much the same rate on convex (6.66 and 6.8) i used the yearn rate of ibEUR as a proxy
  const totalNetAPY = crvFraxVault?.apy?.net_apy + 0.0318 + crvMusdVault?.apy?.net_apy + crvAlusdVault?.apy?.net_apy;
  return (totalNetAPY / 4) * 100;
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
  return useSWR(shouldFetch ? [`yearn-vaults`, chainId] : null, fetcher, {
    refreshInterval: 3 * 1000,
  });
}
