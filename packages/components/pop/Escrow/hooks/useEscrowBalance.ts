import { constants, BigNumber } from "ethers";
import { useIsMounted } from "packages/components/hooks/utils/useIsMounted";
import { BigNumberWithFormatted } from "packages/components/reducers/portfolio";
import { useContractRead } from "wagmi";
import useNamedAccounts from "../../../hooks/useNamedAccounts";
import { formatAndRoundBigNumber } from "@popcorn/utils/src/formatBigNumber";
import { Pop } from "../../types";

/**
 * useEscrowBalance returns the balance a user has in a given pop escrow contract
 */
export const useEscrowBalance: Pop.Hook<{ escrowIds?: string[] }, BigNumberWithFormatted> = ({
  chainId,
  address,
  account,
  enabled,
  escrowIds,
}) => {
  const isMounted = useIsMounted();

  const [metadata] = useNamedAccounts(chainId as any, [address]);

  const _enabled =
    (typeof enabled === "boolean" ? enabled : metadata?.balanceResolver === "escrowBalance") &&
    !!account &&
    !!address &&
    !!chainId &&
    !!isMounted.current;

  const { data, status } = useContractRead({
    abi: ABI,
    address,
    functionName: "getEscrows(bytes32[])",
    chainId: Number(chainId),
    enabled: _enabled,
    cacheOnBlock: true,
    scopeKey: `getEscrows:${chainId}:${address}:${account}`,
    args: (!!_enabled && [escrowIds]) || undefined,
    select: (data) => {
      return (data as [BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, string][]).reduce(
        (total, [start, lastUpdateTime, end, initialBalance, balance, account]) => {
          return total.add(balance);
        },
        constants.Zero,
      );
    },
  });

  return {
    data: data
      ? {
          value: data as BigNumber,
          formatted: formatAndRoundBigNumber(data as BigNumber, 18),
        }
      : undefined,
    status,
  };
};

const ABI = [
  "function getEscrows(bytes32[] calldata) external view returns ((uint256, uint256, uint256, uint256, uint256, address)[])",
  "function getEscrowIdsByUser(address) external view returns (bytes32[])",
];
