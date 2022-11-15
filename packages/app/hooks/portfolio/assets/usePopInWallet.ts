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
  const { account } = useWeb3();

  // calculate for ethereum
  const { xPop: ethXPopAddress, pop: ethPopAddress } = useDeployment(Ethereum);

  const ethPop = useERC20(ethPopAddress, Ethereum);
  const ethBalancesPop = useBalanceAndAllowance(ethPop?.address, account, ethXPopAddress, Ethereum);

  // alt calc for eth
  const ethTokensPrice = useTokenPrices(ethPop?.address, Ethereum);
  const EthPopValue = ethTokensPrice ? ethPop?.balance?.mul(ethTokensPrice) : numberToBigNumber(0, 18);

  // calculate for polygon
  const { xPop: polygonXPopAddress, pop: polygonPopAddress } = useDeployment(Polygon);

  const polygonPop = useERC20(polygonPopAddress, Polygon);
  const polygonBalancesPop = useBalanceAndAllowance(polygonPop?.address, account, polygonXPopAddress, Polygon);

  // alt calc for polygon
  const polyTokensPrice = useTokenPrices(polygonPop?.address, Polygon);
  const polygonPopValue = polyTokensPrice ? polygonPop?.balance?.mul(polyTokensPrice) : numberToBigNumber(0, 18);

  // sum up the balances
  const totalValue = useMemo(() => {
    return BigNumber.from("0")
      .add(ethBalancesPop?.balance || 0)
      .add(polygonBalancesPop?.balance || 0);
  }, [ethBalancesPop?.balance, polygonBalancesPop?.balance]);

  const totalPop = useMemo(() => {
    return BigNumber.from("0")
      .add(polygonPopValue || 0)
      .add(EthPopValue || 0);
  }, [EthPopValue, polygonPopValue]);

  return {
    totalValue,
    totalPop,
  };
}
