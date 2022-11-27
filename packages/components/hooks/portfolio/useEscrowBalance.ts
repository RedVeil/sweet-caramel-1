import { constants, BigNumber } from "ethers";
import { useContractRead } from "wagmi";
import { formatAndRoundBigNumber } from "../../../utils/src/formatBigNumber";
import useSum from "../useSum";
import { useComponentState } from "../useComponentState";
import { BaseTokenProps } from "packages/components/components/types";
import { useIsMounted } from "../utils/useIsMounted";
import { BigNumberWithFormatted } from "../../reducers/portfolio/reducer";

/**
 * useEscrowBalance returns the balance a user has in a given pop escrow contract
 * @returns
 */
export const useEscrowBalance = <T extends BigNumberWithFormatted>({
  address,
  account,
  chainId,
  enabled,
}: BaseTokenProps<T> & { enabled: boolean }) => {
  const isMounted = useIsMounted();
  const {
    data: ids,
    isLoading: idsLoading,
    isError: isIdsError,
    error: idsError,
  } = useContractRead({
    abi: ABI,
    address,
    chainId: Number(chainId),
    enabled: !!enabled && !!account && !!address && !!chainId && !!isMounted.current,
    cacheTime: 30 * 1000,
    cacheOnBlock: true,
    scopeKey: `getEscrowIdsByUser:${chainId}:${address}:${account}`,
    functionName: "getEscrowIdsByUser",
    args: (!!account && [account]) || [],
  });

  const escrowIds = ids as string[] | undefined;

  const { ready } = useComponentState(
    {
      ready:
        !!enabled &&
        escrowIds?.length &&
        !idsLoading &&
        !isIdsError &&
        !!account &&
        !!address &&
        !!chainId &&
        !!isMounted.current,
      loading: idsLoading,
    },
    [enabled, escrowIds, idsLoading, isIdsError, account, address, chainId],
  );

  const { loading, sum, add, reset } = useSum({
    expected: escrowIds?.length || 0,
    timeout: 8000,
    enabled: !!ready,
  });

  const {
    data: balance,
    isLoading: balanceLoading,
    isError: isBalanceError,
    error: balanceError,
    status,
  } = useContractRead({
    abi: ABI,
    address,
    functionName: "getEscrows(bytes32[])",
    chainId: Number(chainId),
    enabled: !!ready,
    cacheOnBlock: true,
    scopeKey: `getEscrows:${chainId}:${address}:${account}`,
    args: (!!ready && [escrowIds]) || undefined,
    select: (data) => {
      return (data as [BigNumber, BigNumber, BigNumber, BigNumber, BigNumber, string][]).reduce(
        (total, [start, lastUpdateTime, end, initialBalance, balance, account]) => {
          !!balance && add(balance);
          return total.add(balance);
        },
        constants.Zero,
      );
    },
  });

  const _loading = enabled && (loading || balanceLoading);

  return {
    data: !enabled
      ? undefined
      : {
          value: (!_loading && !!balance && (balance as BigNumber)) || undefined,
          formatted:
            (!loading && !balanceLoading && balance && formatAndRoundBigNumber(balance as BigNumber, 18)) || undefined,
        },
    isLoading: _loading,
    isError: !!(isIdsError || isBalanceError),
    error: idsError || balanceError,
  };
};

const ABI = [
  "function getEscrows(bytes32[] calldata) external view returns ((uint256, uint256, uint256, uint256, uint256, address)[])",
  "function getEscrowIdsByUser(address) external view returns (bytes32[])",
];
