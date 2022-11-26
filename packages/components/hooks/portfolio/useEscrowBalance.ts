import { constants, BigNumber } from "ethers";
import { useContractRead } from "wagmi";
import { formatAndRoundBigNumber } from "../../../utils/src/formatBigNumber";
import useSum from "../useSum";
import { useComponentState } from "../useComponentState";

/**
 * useEscrowBalance returns the balance a user has in a given pop escrow contract
 * @returns
 */
export const useEscrowBalance = ({ address, account, chainId, enabled }) => {
  const { data: ids, isLoading: idsLoading, isError: isIdsError, error: idsError } = useContractRead({
    abi: ABI,
    address,
    chainId: Number(chainId),
    enabled,
    functionName: "getEscrowIdsByUser",
    args: [account],
  });

  const escrowIds = ids as string[] | undefined;

  const { ready } = useComponentState({
    ready:
      (typeof enabled === "boolean" ? enabled : true) &&
      !escrowIds &&
      !idsLoading &&
      !isIdsError &&
      !!account &&
      !!address &&
      !!chainId,
    loading: idsLoading,
  });

  const { loading, sum, add, reset } = useSum({ expected: escrowIds?.length || 0, timeout: 8000 });

  const { data: balance, isLoading: balanceLoading, isError: isBalanceError, error: balanceError } = useContractRead({
    abi: ABI,
    address,
    chainId: Number(chainId),
    enabled: ready,
    args: [ids],
    select: (data) => {
      return (data as [BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, string][]).reduce(
        (total, [start, lastUpdateTime, end, initialBalance, balance, account]) => {
          add(balance);
          return total.add(balance);
        },
        constants.Zero,
      );
    },
  });

  return {
    data: {
      value: (!loading && !!sum && (sum as BigNumber)) || undefined,
      formatted: (!loading && !!balance && formatAndRoundBigNumber(balance as BigNumber, 18)) || undefined,
    },
    isLoading: idsLoading || loading,
    isError: !!(isIdsError || isBalanceError),
    error: idsError || balanceError,
  };
};

const ABI = [
  "function getEscrows(bytes32[] calldata) external view returns ((uint256, uint256, uint256, uint256, uint256, address)[])",
  "function getEscrowIdsByUser(address) external view returns (bytes32[])",
];
