import { useNamedAccounts } from "@popcorn/components/pop/utils";
import { Pop } from "../../types";
import { useContractRead } from "wagmi";
/**
 * useClaimableBalance returns the claimable token for a staking contract
 */
export const useClaimableToken: Pop.Hook<string> = ({ chainId, address, enabled }: Pop.StdProps) => {
  const [metadata] = useNamedAccounts(chainId as any, (!!address && [address]) || []);
  const _apyResolver = metadata?.apyResolver === "synthetix";

  const _enabled =
    typeof enabled === "boolean"
      ? !!enabled && !!address && !!chainId && _apyResolver
      : !!address && !!chainId && _apyResolver;

  return useContractRead({
    enabled: _enabled,
    scopeKey: `staking:synthetix:claimableToken:${chainId}:${address}`,
    cacheOnBlock: true,
    address,
    chainId: Number(chainId),
    abi: ["function rewardsToken() external view returns (address)"],
    functionName: "rewardsToken",
  }) as Pop.HookResult<string>;
};
