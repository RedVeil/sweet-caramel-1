import { useCallback, useMemo } from "react";
import { ChainId } from "@popcorn/utils";
import { BigNumber, constants } from "ethers/lib/ethers";
import useTokenBalance from "@popcorn/app/hooks/tokens/useTokenBalance";
import useTokenPrices from "@popcorn/app/hooks/tokens/useTokenPrices";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import { useGetUserEscrows } from "@popcorn/app/hooks/useGetUserEscrows";
import useWeb3 from "@popcorn/app/hooks/useWeb3";

function getHoldingValue(tokenAmount: BigNumber, tokenPrice: BigNumber): BigNumber {
  tokenAmount = tokenAmount ? tokenAmount : constants.Zero;
  return tokenAmount.eq(constants.Zero) || tokenPrice.eq(constants.Zero)
    ? constants.Zero
    : tokenAmount.mul(tokenPrice).div(constants.WeiPerEther);
}

export default function useCommonNetworthFunctions(chainId, network) {
  const { Ethereum } = ChainId;
  const ethereum = useDeployment(Ethereum);
  const { account } = useWeb3();
  const useHoldingValue = useCallback(getHoldingValue, []);

  const { data: mainnetPriceData } = useTokenPrices([ethereum.pop, ethereum.popUsdcArrakisVault], Ethereum); // in 1e18
  const popPrice = mainnetPriceData?.[ethereum.pop];
  const { data: chainPopBalance } = useTokenBalance(chainId?.pop, account, network);
  const { data: chainEscrow } = useGetUserEscrows(chainId.rewardsEscrow, account, network);

  return {
    popPrice,
    getHoldingValue,
    useHoldingValue,
    account,
    chainPopBalance,
    chainEscrow,
  };
}
