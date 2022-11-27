import { BigNumber } from "ethers";
import { useContractRead } from "wagmi";
import { formatAndRoundBigNumber } from "@popcorn/utils";
import { useNamedAccounts, useIsMounted } from "../../utils";
import { BigNumberWithFormatted, Pop } from "../../types";

export const useBalanceOf: Pop.WagmiHook<BigNumberWithFormatted> = ({ chainId, address, account }) => {
  const isMounted = useIsMounted();

  const [metadata] = useNamedAccounts(chainId as any, [address]);

  return useContractRead({
    address,
    chainId: Number(chainId),
    abi: ["function balanceOf(address) external view returns (uint256)"],
    functionName: "balanceOf",
    args: (!!account && !!isMounted && [account]) || [],
    cacheOnBlock: true,
    scopeKey: `balanceOf:${chainId}:${address}:${account}`,
    enabled:
      typeof metadata?.balanceResolver !== "undefined"
        ? metadata.balanceResolver == "balanceOf" && !!account && !!address && !!chainId && !!isMounted
        : !!account && !!address && !!chainId && !!isMounted,
    select: (data) => {
      return {
        value: (data as BigNumber) || BigNumber.from(0),
        formatted: formatAndRoundBigNumber(data as BigNumber, 18),
      };
    },
  }) as Pop.WagmiHookResult<BigNumberWithFormatted>;
};
