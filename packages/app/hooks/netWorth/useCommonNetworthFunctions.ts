import { useCallback, useMemo } from "react";
import { ChainId } from "@popcorn/utils";
import { BigNumber, constants } from "ethers/lib/ethers";
import usePopLocker from "hooks/staking/usePopLocker";
import useTokenBalance from "hooks/tokens/useTokenBalance";
import useTokenPrices from "hooks/tokens/useTokenPrices";
import { useDeployment } from "hooks/useDeployment";
import { useGetUserEscrows } from "hooks/useGetUserEscrows";
import useWeb3 from "hooks/useWeb3";

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
