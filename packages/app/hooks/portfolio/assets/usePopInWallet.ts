import { ChainId, numberToBigNumber } from "@popcorn/utils";
import { BigNumber } from "ethers";
import useBalanceAndAllowance from "hooks/staking/useBalanceAndAllowance";
import useERC20 from "hooks/tokens/useERC20";
import { useDeployment } from "hooks/useDeployment";
import useTokenPrices from "hooks/tokens/useTokenPrices";
import useWeb3 from "hooks/useWeb3";
import { useMemo } from "react";

export default function usePopInWallet() {
  const { Ethereum, Polygon } = ChainId;
  const ethereum = useDeployment(Ethereum);
  const polygon = useDeployment(Polygon);
  const { account } = useWeb3();

  // calculate for ethereum
  const { pop: ethereumPopAddress } = useDeployment(Ethereum);
  const ethereumPop = useERC20(ethereumPopAddress, Ethereum);
  const { data: ethereumLpPriceData } = useTokenPrices([ethereum.pop, ethereum.popUsdcArrakisVault], Polygon); // in 1e18
  const ethereumLpPrice = ethereumLpPriceData?.[ethereum.popUsdcArrakisVault];
  const ethereumPopValue = ethereumLpPrice ? ethereumPop?.balance?.mul(ethereumLpPrice) : numberToBigNumber(0, 18);

  // calculate for polygon
  const { pop: polygonPopAddress } = useDeployment(Polygon);
  const polygonPop = useERC20(polygonPopAddress, Polygon);
  const { data: poylgonLpPriceData } = useTokenPrices([polygon.pop, polygon.popUsdcArrakisVault], Polygon); // in 1e18
  const polygonLpPrice = poylgonLpPriceData?.[polygon.popUsdcArrakisVault];
  const polygonPopValue = polygonLpPrice ? polygonPop?.balance?.mul(polygonLpPrice) : numberToBigNumber(0, 18);

  const totalPop = useMemo(() => {
    return BigNumber.from("0")
      .add(polygonPopValue || 0)
      .add(ethereumPopValue || 0);
  }, [ethereumPopValue, polygonPopValue]);

  return {
    totalPop,
  };
}
