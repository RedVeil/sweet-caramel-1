import { constants, BigNumber } from "ethers";
import { useIsMounted } from "packages/components/hooks/utils/useIsMounted";
import { BigNumberWithFormatted } from "packages/components/reducers/portfolio";
import { useContractRead } from "wagmi";
import useNamedAccounts from "../../../hooks/useNamedAccounts";
import { formatAndRoundBigNumber } from "@popcorn/utils/src/formatBigNumber";
import { Pop } from "../types";

/**
 * useEscrowBalance returns the balance a user has in a given pop escrow contract
 * @returns
 */

interface UseEscrowBalanceProps extends Pop.BaseContractProps {
  escrowIds?: string[];
}
export const useEscrowBalance: Pop.WagmiHook<BigNumberWithFormatted, UseEscrowBalanceProps> = ({
  chainId,
  address,
  account,
  enabled,
  escrowIds,
}) => {
  const isMounted = useIsMounted();
  const [metadata] = useNamedAccounts(chainId as any, [address]);

  const _enabled =
    !!account && !!address && !!chainId && !!isMounted.current && (typeof enabled === "boolean" ? enabled : true);
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
