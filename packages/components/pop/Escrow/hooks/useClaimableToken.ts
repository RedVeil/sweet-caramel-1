import { useNamedAccounts } from "@popcorn/components/pop/utils";
import { Pop } from "../../types";
import { useContractRead } from "wagmi";
import { useEffect, useState } from "react";
/**
 * useClaimableBalance returns the claimable token for a staking contract
 */
export const useClaimableToken: Pop.Hook<string> = ({ chainId, address, enabled }: Pop.StdProps) => {
  const [metadata] = useNamedAccounts(chainId as any, (!!address && [address]) || []);
  const isEscrow = metadata?.balanceResolver === "escrowBalance";

  const _enabled =
    typeof enabled === "boolean"
      ? !!enabled && !!address && !!chainId && !!isEscrow
      : !!address && !!chainId && !!isEscrow;

  return useContractRead({
    enabled: _enabled,
    scopeKey: `escrow:claimableToken:${chainId}:${address}`,
    cacheOnBlock: true,
    address,
    chainId: Number(chainId),
    abi: ["function POP() external view returns (address)"],
    functionName: "POP",
  }) as Pop.HookResult<string>;
};
