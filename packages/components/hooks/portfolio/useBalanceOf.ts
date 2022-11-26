import { BigNumber } from "ethers";
import { formatAndRoundBigNumber } from "packages/utils";
import { useContractRead } from "wagmi";
import useNamedAccounts from "../useNamedAccounts";

export const useBalanceOf = ({ chainId, address, account }) => {
  const [metadata] = useNamedAccounts(chainId as any, [address]);
  return useContractRead({
    address,
    chainId: Number(chainId),
    abi: ["function balanceOf(address) external view returns (uint256)"],
    functionName: "balanceOf",
    args: (!!account && [account]) || undefined,
    cacheOnBlock: true,
    cacheTime: 1000 * 60,
    enabled:
      typeof metadata?.balanceResolver !== "undefined"
        ? metadata.balanceResolver == "balanceOf" && !!account && !!address && !!chainId
        : !!account && !!address && !!chainId,
    select: (data) => {
      return {
        value: (data as BigNumber) || BigNumber.from(0),
        formatted: formatAndRoundBigNumber(data as BigNumber, 18),
      };
    },
  });
};
