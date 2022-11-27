import { useContractRead } from "wagmi";
import { BigNumber } from "ethers/lib/ethers";
import { Pop } from "../../types";

export const useTotalSupply: Pop.Hook<BigNumber> = ({ address, chainId, enabled }) => {
  return useContractRead({
    address,
    chainId,
    abi: ["function totalSupply() external view returns (uint256)"],
    functionName: "totalSupply()",
    cacheOnBlock: true,
    scopeKey: `totalSupply:${chainId}:${address}`,
    enabled: typeof enabled !== "undefined" ? enabled && !!address && !!chainId : !!address && !!chainId,
    select: (result) => result as BigNumber,
  }) as Pop.HookResult<BigNumber>;
};
