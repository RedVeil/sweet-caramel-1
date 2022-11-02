import { ChainId } from "@popcorn/utils";
import { BigNumber, ethers } from "ethers";
import useGetButterTokenPriceInUSD from "@popcorn/app/hooks/useGetButterTokenPriceInUSD";
import useGetPopTokenPriceInUSD from "@popcorn/app/hooks/useGetPopTokenPriceInUSD";
import useGetPopUsdcLpTokenPriceInUSD from "@popcorn/app/hooks/useGetPopUsdcLpTokenPriceInUSD";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import useGetThreeXTokenPrice from "@popcorn/app/hooks/useGetTreeXTokenPrice";

export default function useTokenPrice(address: string | undefined, chainId: ChainId): BigNumber | undefined {
  const { pop, butter, popUsdcArrakisVault, popUsdcLp, threeX } = useDeployment(chainId);

  const { data: popPrice, error: err1 } = useGetPopTokenPriceInUSD();
  const { data: popUsdcLpPrice, error: err2 } = useGetPopUsdcLpTokenPriceInUSD(address, chainId);
  const { data: butterPrice, error: err3 } = useGetButterTokenPriceInUSD(chainId);
  const { data: threeXPrice } = useGetThreeXTokenPrice(chainId);

  if (!address) return undefined;
  switch (address.toLowerCase()) {
    case pop?.toLowerCase():
      return popPrice ? ethers.utils.parseEther(ethers.utils.formatUnits(popPrice, 6)) : undefined;
    case butter?.toLowerCase():
      return butterPrice;
    case popUsdcArrakisVault?.toLowerCase():
    case popUsdcLp?.toLowerCase():
      return popUsdcLpPrice ? ethers.utils.parseEther(ethers.utils.formatUnits(popUsdcLpPrice, 6)) : undefined;
    case threeX?.toLowerCase():
      return threeXPrice;
  }
}
