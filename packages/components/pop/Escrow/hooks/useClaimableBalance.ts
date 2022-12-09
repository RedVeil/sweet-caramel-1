import { BigNumber, constants } from "ethers";
import { useNamedAccounts } from "@popcorn/components/pop/utils";
import { formatAndRoundBigNumber } from "@popcorn/utils/src/formatBigNumber";
import { Pop, BigNumberWithFormatted } from "../../types";
import { useContractReads } from "wagmi";
/**
 * useClaimableBalance returns the claimable balance a user has across all escrow records
 */
export const useClaimableBalance: Pop.Hook<BigNumberWithFormatted> = ({
  chainId,
  address,
  account,
  enabled,
  escrowIds,
}: { escrowIds?: string[] } & Pop.StdProps) => {
  const [metadata] = useNamedAccounts(chainId as any, (!!address && [address]) || []);

  const _enabled =
    (typeof enabled === "boolean" ? enabled : metadata?.balanceResolver === "escrowBalance") &&
    !!account &&
    !!address &&
    !!chainId;

  const { data, status } = useContractReads({
    enabled: _enabled,
    scopeKey: `escrow:claimable:${chainId}:${address}:${account}`,
    cacheOnBlock: true,
    contracts: escrowIds?.map((escrowId) => ({
      address: (!!address && address) || "",
      chainId: Number(chainId),
      abi: ["function getClaimableAmount(bytes32) external view returns (uint256)"],
      functionName: "getClaimableAmount",
      args: [escrowId],
    })),
  }) as Pop.HookResult<BigNumber[]>;

  return {
    data: data
      ? {
          value: data?.reduce((acc, curr) => acc.add(curr), constants.Zero),
          formatted:
            data && formatAndRoundBigNumber(data.reduce((acc, curr) => acc.add(curr), constants.Zero) as BigNumber, 18),
        }
      : undefined,
    status,
  } as Pop.HookResult<BigNumberWithFormatted>;
};
