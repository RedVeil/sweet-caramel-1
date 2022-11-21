import { ChainId } from "@popcorn/utils";
import { useContractRead } from "wagmi";
import { BigNumber } from "ethers";
import { useEscrowBalance } from "./useEscrowBalance";

//
/**
 * useBalance  - this hook is used to fetch the balance of staking contracts which do not implement erc20 interface and therefore cannot be used by the wagmi useBalance hook
 * @returns { data: { value } }, isError, isLoading, error } - token holders account balance
 */
export const useBalance = ({
  token,
  chainId,
  account,
  enabled,
  alias,
}: {
  token: string;
  chainId: ChainId;
  account: string;
  enabled: boolean;
  alias?: string;
}) => {
  const { data, isError, isLoading, error } = useContractRead({
    address: token,
    chainId,
    abi: ["function balanceOf(address) external view returns (uint256)"],
    functionName: "balanceOf",
    args: [account],
    cacheOnBlock: true,
    cacheTime: 1000 * 60,
    enabled:
      (typeof enabled === "boolean" && enabled && !rewards_escrow.includes(alias)) ||
      (!!account && !!token && !!chainId && !rewards_escrow.includes(alias)),
  });

  const {
    data: { value: escrowBalance },
  } = useEscrowBalance({ address: token, account, chainId, enabled: rewards_escrow.includes(alias) || false });

  return {
    data: {
      value: rewards_escrow.includes(alias) ? (escrowBalance as unknown as BigNumber) : (data as unknown as BigNumber),
    },
    isError,
    isLoading,
    error,
  };
};

const rewards_escrow = ["rewardsEscrow"];

export default useBalance;
