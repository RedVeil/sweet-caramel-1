import { useToken as _useToken } from "wagmi";
import useNamedAccounts from "./useNamedAccounts";

interface UseTokenProps {
  chainId: number;
  token?: string; // todo get correct type
  alias?: string;
  enabled?: boolean;
}

export const useToken = ({ chainId, token, enabled, alias }: UseTokenProps) => {
  const [metadata] = useNamedAccounts(chainId.toString() as any, (token && [token]) || []);

  const { data, isLoading, isError } = _useToken({
    chainId,
    address: token as "0x${string}",
    enabled:
      typeof metadata?.isERC20 !== "undefined" && !metadata.isERC20
        ? false
        : typeof enabled === "boolean"
        ? enabled
        : !!token && !!chainId,
  });

  return { data: { ...data, ...metadata }, isLoading, isError };
};

export default useToken;
