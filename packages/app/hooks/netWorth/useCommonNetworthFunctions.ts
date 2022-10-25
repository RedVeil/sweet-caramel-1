import { BigNumber, constants } from "ethers/lib/ethers";
import { parseEther } from "ethers/lib/utils";
import usePopLocker from "hooks/staking/usePopLocker";
import useTokenBalance from "hooks/tokens/useTokenBalance";
import useGetPopTokenPriceInUSD from "hooks/useGetPopTokenPriceInUSD";
import { useGetUserEscrows } from "hooks/useGetUserEscrows";
import useWeb3 from "hooks/useWeb3";
import { useCallback, useMemo } from "react";

function getHoldingValue(tokenAmount: BigNumber, tokenPrice: BigNumber): BigNumber {
  tokenAmount = tokenAmount ? tokenAmount : constants.Zero;
  return tokenAmount.eq(constants.Zero) || tokenPrice.eq(constants.Zero)
    ? constants.Zero
    : tokenAmount.mul(tokenPrice).div(constants.WeiPerEther);
}

export default function useCommonNetworthFunctions(chainId, network) {
  const { account } = useWeb3();
  const useHoldingValue = useCallback(getHoldingValue, []);
  const { data: popPrice } = useGetPopTokenPriceInUSD(); // in 1e6
  const raisedPopPrice = useMemo(() => (popPrice ? popPrice.mul(parseEther("0.000001")) : constants.Zero), [popPrice]);

  const { data: popBalance } = useTokenBalance(network.pop, account, chainId);
  const { data: escrowBalance } = useGetUserEscrows(network.rewardsEscrow, account, chainId);
  const { data: vaultEscrow } = useGetUserEscrows(network.vaultsRewardsEscrow, account, chainId);
  const { data: popStaking } = usePopLocker(network.popStaking, chainId);
  const popStakingHoldings = useHoldingValue(popStaking?.userStake, raisedPopPrice);

  const escrowHoldings = useHoldingValue(
    BigNumber.from("0")
      .add(escrowBalance?.totalClaimablePop || "0")
      .add(escrowBalance?.totalVestingPop || "0")
      .add(vaultEscrow?.totalClaimablePop || "0")
      .add(vaultEscrow?.totalVestingPop || "0"),
    raisedPopPrice,
  );

  const popHoldings = useHoldingValue(popBalance, raisedPopPrice);

  return {
    raisedPopPrice,
    escrowHoldings,
    popHoldings,
    popStakingHoldings,
    useHoldingValue,
  };
}
