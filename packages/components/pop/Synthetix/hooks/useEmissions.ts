import { BigNumber } from "ethers";
import { useContractRead } from "wagmi";
import { formatAndRoundBigNumber } from "@popcorn/utils";
import { useNamedAccounts } from "../../utils";
import { BigNumberWithFormatted, Pop } from "../../types";
import useLog from "../../utils/hooks/useLog";

interface UseEmissionsProps extends Pop.StdProps {
  days: number
}

export const useEmissions = ({ chainId, address, days, enabled }: UseEmissionsProps) => {
  const [metadata] = useNamedAccounts(chainId as any, (!!address && [address]) || []);

  const _apyResolver = metadata?.apyResolver === "synthetix";

  const _enabled =
    typeof enabled === "boolean"
      ? !!enabled && !!address && !!chainId && _apyResolver
      : !!address && !!chainId && _apyResolver;

  const { data, status } = useContractRead({
    address: (!!address && address) || "",
    chainId: Number(chainId),
    abi: ["function rewardRate() view returns (uint256)"],
    functionName: "rewardRate",
    enabled: !!_enabled,
    scopeKey: `synthetix:emission:${chainId}:${address}`,
    cacheOnBlock: true,
  }) as Pop.HookResult<BigNumber>;

  useLog({ address, metadata, _apyResolver, enabled, chainId, _enabled }, [address, metadata, _apyResolver, enabled, chainId, _enabled])

  const daysInSeconds = 60 * 60 * 24 * days;

  const tokenEmission = data?.mul(BigNumber.from(daysInSeconds));


  return {
    data: {
      value: tokenEmission,
      formatted: tokenEmission ? formatAndRoundBigNumber(tokenEmission, 18) : undefined,
    },
    status: status,
  } as Pop.HookResult<BigNumberWithFormatted>;
};
