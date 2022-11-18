import { constants, BigNumber } from "ethers";
import { useContractRead } from "wagmi";

/**
 * useEscrowBalance returns the balance a user has in a given pop escrow contract
 * @returns
 */
export const useEscrowBalance = ({ address, account, chainId, enabled }) => {
  const { data: ids, isLoading: idsLoading, isError: isIdsError, error: idsError } = useContractRead({
    abi: ABI,
    address,
    chainId,
    enabled,
    functionName: "getEscrowIdsByUser",
    args: [account],
  });

  const { data: balance, isLoading: balanceLoading, isError: isBalanceError, error: balanceError } = useContractRead({
    abi: ABI,
    address,
    chainId,
    enabled: enabled && !!((ids as unknown) as string[])?.length && !isIdsError,
    functionName: "getEscrows",
    args: [ids],
    select: (data) => {
      return (data as [BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, string][]).reduce(
        (total, [start, lastUpdateTime, end, initialBalance, balance, account]) => total.add(balance),
        constants.Zero,
      );
    },
  });

  return {
    data: { value: balance || constants.Zero },
    isLoading: idsLoading || balanceLoading,
    isError: isIdsError || isBalanceError,
  };
};

const ABI = [
  "function getEscrows(bytes32[] calldata) external view returns ((uint256, uint256, uint256, uint256, uint256, address)[])",
  "function getEscrowIdsByUser(address) external view returns (bytes32[])",
];
