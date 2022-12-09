import { BigNumber } from "ethers";
import { useContractRead, useContractReads, useProvider } from "wagmi";
import { formatAndRoundBigNumber } from "@popcorn/utils";
import { popHookAdapter, useNamedAccounts } from "../../utils";
import { BigNumberWithFormatted, Pop } from "../../types";
import { useMemo } from "react";
import { isAddress } from "@ethersproject/address";
import { Staking__factory, PopLocker__factory } from "@popcorn/hardhat/typechain";
import useSWR from "swr";
import useLog from "../../utils/hooks/useLog";

interface UseEmissionsProps extends Pop.StdProps {
  days: number
}
// { chainId, address, isPop }: UseEmissionsProps
export const useEmissions = ({ chainId, address, days, enabled }: UseEmissionsProps) => {
  const [metadata] = useNamedAccounts(chainId as any, (!!address && [address]) || []);

  const _apyResolver = metadata?.apyResolver === "synthetix";

  const _enabled =
    typeof enabled === "boolean"
      ? !!enabled && !!address && !!chainId && _apyResolver
      : !!address && !!chainId && _apyResolver;
  const { data, status } = useContractRead({
    address,
    chainId: Number(chainId),
    abi: ["function rewardRate() view returns (uint256)"],
    functionName: "rewardRate",
    enabled: _enabled
  }) as Pop.HookResult<BigNumber>;

  useLog({ address, _apyResolver }, [address, _apyResolver])

  const daysInSeconds = 60 * 60 * 24 * days;

  const tokenEmission = data?.mul(BigNumber.from(daysInSeconds));

  // console.log(address, data, status);


  return {
    data: {
      value: tokenEmission,
      formatted: tokenEmission ? formatAndRoundBigNumber(tokenEmission, 18) : undefined,
    },
    status: status,
  } as Pop.HookResult<BigNumberWithFormatted>;
};
