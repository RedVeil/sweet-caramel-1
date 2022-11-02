import { parseEther } from "@ethersproject/units";
import { IGUni__factory } from "@popcorn/hardhat/typechain";
import { ChainId } from "@popcorn/utils";
import { ethers } from "ethers";
import useSWR from "swr";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import { useRpcProvider } from "@popcorn/app/hooks/useRpcProvider";

// Returns the popPrice in 1e6
export const getPopTokenPrice = async (provider: ethers.providers.JsonRpcProvider, address: string) => {
  try {
    const popUsdcLp = IGUni__factory.connect(address, provider);
    const [usdcAmount, popAmount] = await popUsdcLp.getUnderlyingBalances();
    return usdcAmount.mul(parseEther("1")).div(popAmount);
  } catch (ex) {
    console.log("error while querying pop price. ex - ", ex.toString(), address);
  }
};

// Hook to return the popPrice in 1e6
export default function useGetPopTokenPriceInUSD(chainId?) {
  if (!chainId) {
    chainId = ChainId.Ethereum;
  }
  const { popUsdcArrakisVault } = useDeployment(chainId);

  const provider = useRpcProvider(chainId);
  // to be able to fetch pop prices on arbitrum and bnb as the pools do not exist on those chains.
  const shouldFetch = provider && popUsdcArrakisVault;
  return useSWR(shouldFetch ? ["getPopTokenPrice", provider] : null, async () =>
    getPopTokenPrice(provider, popUsdcArrakisVault),
  );
}
