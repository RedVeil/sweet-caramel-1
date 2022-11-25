import { ChainId } from "@popcorn/utils";
import { useContractRead } from "wagmi";
import { BigNumber } from "ethers";
import { useEscrowBalance } from "./useEscrowBalance";
import useNamedAccounts from "../useNamedAccounts";

/**
 * useBalance  - this hook is used to fetch the balance of staking contracts which do not implement erc20 interface and therefore cannot be used by the wagmi useBalance hook
 * @returns { data: { value } }, isError, isLoading, error } - token holders account balance
 */
export const useBalance = ({
  token,
  chainId,
  account,
  enabled,
}: {
  token: string;
  chainId: ChainId;
  account: string;
  enabled?: boolean;
}) => {
  const [metadata] = useNamedAccounts(chainId as any, [token]);

  const { data: balanceOf, isError, isLoading, error } = useContractRead({
    address: token,
    chainId,
    abi: ["function balanceOf(address) external view returns (uint256)"],
    functionName: "balanceOf",
    args: [account],
    cacheOnBlock: true,
    cacheTime: 1000 * 60,
    enabled:
      metadata?.balanceResolver && metadata?.balanceResolver !== "balanceOf"
        ? false
        : typeof enabled === "boolean"
        ? !!account && !!token && !!chainId && enabled
        : !!account && !!token && !!chainId,
  });

  const {
    data: { value: escrowBalance },
  } = useEscrowBalance({
    address: token,
    account,
    chainId,
    enabled: metadata?.balanceResolver
      ? metadata.balanceResolver == "rewardsEscrow" && !!account && !!token && !!chainId
      : false,
  });

  return {
    data: {
      value: ((balanceOf as unknown) as BigNumber | undefined) || ((escrowBalance as unknown) as BigNumber | undefined),
    },
    isError,
    isLoading,
    error,
  };
};

export default useBalance;
