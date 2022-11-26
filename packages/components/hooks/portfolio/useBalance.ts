import { ChainId } from "@popcorn/utils";
import { useContractRead } from "wagmi";
import { BigNumber } from "ethers";
import { useEscrowBalance } from "./useEscrowBalance";
import useNamedAccounts from "../useNamedAccounts";
import { formatAndRoundBigNumber } from "../../../utils/src/formatBigNumber";
import { useEffect } from "react";
import useLog from "../utils/useLog";

/**
 * useBalance  - this hook is used to fetch the balance of staking contracts which do not implement erc20 interface and therefore cannot be used by the wagmi useBalance hook
 * @returns { data: { value } }, isError, isLoading, error } - token holders account balance
 */
export const useBalance = ({
  address,
  chainId,
  account,
  enabled,
}: {
  address: string;
  chainId: ChainId;
  account?: string;
  enabled?: boolean;
}) => {
  const [metadata] = useNamedAccounts(chainId as any, [address]);

  const { data: balanceOf, isError, isLoading, error } = useContractRead({
    address,
    chainId: Number(chainId),
    abi: ["function balanceOf(address) external view returns (uint256)"],
    functionName: "balanceOf",
    args: [account],
    cacheOnBlock: true,
    cacheTime: 1000 * 60,
    enabled:
      typeof metadata?.balanceResolver !== "undefined"
        ? metadata.balanceResolver == "balanceOf" && !!account && !!address && !!chainId
        : !!account && !!address && !!chainId && enabled,
    select: (data) => {
      return {
        value: (data as BigNumber) || BigNumber.from(0),
        formatted: formatAndRoundBigNumber(data as BigNumber, 18),
      };
    },
  });

  const {
    data: escrowBalance,
    isLoading: escrowBalanceLoading,
    isError: escrowBalanceError,
    error: escrowBalanceErrorMessage,
  } = useEscrowBalance({
    address,
    account,
    chainId,
    enabled:
      typeof metadata?.balanceResolver !== "undefined"
        ? metadata.balanceResolver == "rewardsEscrow" && !!account && !!address && !!chainId
        : false,
  });

  useLog({ escrowBalance, escrowBalanceLoading });
  return {
    data: {
      ...escrowBalance,
      ...(balanceOf as Response),
    },
    isError: isError || escrowBalanceError,
    error: escrowBalanceErrorMessage || error,
    isValidating: isLoading || escrowBalanceLoading,
    isLoading: escrowBalanceLoading || isLoading,
  };
};

type Response = {
  data?: {
    value?: BigNumber;
    formatted?: string;
  };
};

export default useBalance;
