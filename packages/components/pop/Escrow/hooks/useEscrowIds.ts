import { useIsMounted } from "packages/components/hooks/utils/useIsMounted";
import { useContractRead } from "wagmi";
import useNamedAccounts from "../../../hooks/useNamedAccounts";
import { Pop } from "../../types";

/**
 * useEscrowBalance returns the balance a user has in a given pop escrow contract
 * @returns
 */
export const useEscrowIds: Pop.Hook<string[]> = ({ chainId, address, account, enabled }) => {
  const isMounted = useIsMounted();
  const [metadata] = useNamedAccounts(chainId as any, [address]);
  const _enabled = typeof enabled === "boolean" ? enabled : metadata?.balanceResolver === "escrowBalance";
  const { data, status } = useContractRead({
    abi: ABI,
    address,
    chainId: Number(chainId),
    enabled: !!_enabled && !!account && !!address && !!chainId && !!isMounted.current,
    cacheTime: 30 * 1000,
    cacheOnBlock: true,
    scopeKey: `getEscrowIdsByUser:${chainId}:${address}:${account}`,
    functionName: "getEscrowIdsByUser",
    args: (!!account && [account]) || [],
  });

  return {
    data,
    status,
  } as Pop.HookResult<string[]>;
};

const ABI = [
  "function getEscrows(bytes32[] calldata) external view returns ((uint256, uint256, uint256, uint256, uint256, address)[])",
  "function getEscrowIdsByUser(address) external view returns (bytes32[])",
];
