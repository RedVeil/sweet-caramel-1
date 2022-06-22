import { parseEther } from "@ethersproject/units";
import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { IGUni__factory } from "@popcorn/hardhat/typechain";
import { ChainId, PRC_PROVIDERS } from "@popcorn/utils";
import { Address } from "@popcorn/utils/types";
import { ethers } from "ethers";
import useSWR from "swr";

export const getPopTokenPrice = async (provider: ethers.providers.JsonRpcProvider, popUsdcLpAddress: Address) => {
  try {
    const popUsdcLp = IGUni__factory.connect(popUsdcLpAddress, provider);
    const [usdcAmount, popAmount] = await popUsdcLp.getUnderlyingBalances();
    const popPrice = usdcAmount.mul(parseEther("1")).div(popAmount);
    return popPrice;
  } catch (ex) {
    console.log("error while querying pop price. ex - ", ex.toString());
  }
};

export default function useGetPopTokenPriceInUSD() {
  const mainnetProvider = PRC_PROVIDERS[ChainId.Ethereum];
  // to be able to fetch pop prices on arbitrum and bnb as the pools do not exist on those chains.
  const contractAddresses = getChainRelevantContracts(1);
  const shouldFetch = mainnetProvider && contractAddresses && contractAddresses.popUsdcLp;
  return useSWR(shouldFetch ? ["getPopTokenPrice", mainnetProvider] : null, async () =>
    getPopTokenPrice(mainnetProvider, contractAddresses.popUsdcLp),
  );
}
