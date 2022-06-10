import { Address } from "@popcorn/utils/types";
import { BigNumber, ethers } from "ethers";
import useGetButterTokenPriceInUSD from "hooks/useGetButterTokenPriceInUSD";
import useGetPopTokenPriceInUSD from "hooks/useGetPopTokenPriceInUSD";
import useGetPopUsdcLpTokenPriceInUSD from "hooks/useGetPopUsdcLpTokenPriceInUSD";
import useGetThreeXTokenPrice from "./useGetTreeXTokenPrice";
import useWeb3 from "./useWeb3";

export default function useTokenPrice(token: Address | undefined): BigNumber | undefined {
  const { data: popPrice, error: err1 } = useGetPopTokenPriceInUSD();
  const { data: popUsdcLpPrice, error: err2 } = useGetPopUsdcLpTokenPriceInUSD();
  const { data: butterPrice, error: err3 } = useGetButterTokenPriceInUSD();
  const { data: threeXPrice } = useGetThreeXTokenPrice();
  const { contractAddresses } = useWeb3();
  if (!token) return undefined;
  switch (token.toLowerCase()) {
    case contractAddresses.pop?.toLowerCase():
      return popPrice ? ethers.utils.parseEther(ethers.utils.formatUnits(popPrice, 6)) : undefined;
    case contractAddresses.butter?.toLowerCase():
      return butterPrice;
    case contractAddresses.popUsdcLp?.toLowerCase():
      return popUsdcLpPrice ? ethers.utils.parseEther(ethers.utils.formatUnits(popUsdcLpPrice, 6)) : undefined;
    case contractAddresses.threeX?.toLowerCase():
      return threeXPrice;
  }
}
