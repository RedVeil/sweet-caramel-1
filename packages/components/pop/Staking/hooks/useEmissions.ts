import { BigNumber } from "ethers";
import { useContractRead, useProvider } from "wagmi";
import { ChainId, formatAndRoundBigNumber } from "@popcorn/utils";
import { popHookAdapter, useNamedAccounts } from "../../utils";
import { BigNumberWithFormatted, Pop } from "../../types";
import { useContractMetadata } from "../../Contract";
import { useMemo } from "react";
import { isAddress } from "@ethersproject/address";
import { Staking__factory, PopLocker__factory, Staking, PopLocker } from "@popcorn/hardhat/typechain";
import useSWR, { SWRResponse } from "swr";

interface UseEmissionsProps extends Pop.StdProps {
  isPop: boolean;
}
export const useEmissions = ({ chainId, address, isPop }: UseEmissionsProps) => {
  const provider = useProvider({ chainId: Number(chainId) });
  const stakingContract = useMemo(
    () => !!address && isAddress(address) && !!chainId && !!provider && (isPop ? PopLocker__factory.connect(address, provider) : Staking__factory.connect(address, provider)),
    [chainId, address, provider, isPop],
  );

  const getStakingEmission = async (isPop: boolean, stakingContract) => {
    if (stakingContract) {
      let tokenPerWeek: BigNumber;
      if (isPop) {
        const tokenAddress = await stakingContract.stakingToken();
        tokenPerWeek = await stakingContract?.getRewardForDuration(tokenAddress);
      } else {
        tokenPerWeek = await stakingContract?.getRewardForDuration();
      }
      const tokenEmission = tokenPerWeek?.div(7) || BigNumber.from(0)
      return ({
        value: tokenEmission,
        formatted: tokenEmission ? formatAndRoundBigNumber(tokenEmission, 18) : undefined
      })
    }
  }

  return popHookAdapter(useSWR(!!stakingContract && !!chainId ? [address, chainId, provider, stakingContract] : null, async () => {
    return getStakingEmission(isPop, stakingContract);
  })) as Pop.HookResult<BigNumberWithFormatted>

};
