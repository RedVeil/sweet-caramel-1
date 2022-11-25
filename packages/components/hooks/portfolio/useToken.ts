import { useNamedAccounts } from "../../hooks";
import { useToken as _useToken } from "wagmi";
import { PortfolioToken } from "../../reducers/portfolio";

interface UseTokenProps {
  chainId: number;
  token?: PortfolioToken;
  alias?: string;
  enabled?: boolean;
}

export const useToken = ({ chainId, token, enabled, alias }: UseTokenProps) => {
  const [metadata] = useNamedAccounts(chainId.toString() as any, (token?.address && [token.address]) || undefined);

  const { data, isLoading, isError } = _useToken({
    chainId,
    address: token?.address as "0x${string}",
    enabled:
      typeof metadata?.isERC20 !== "undefined" && !metadata.isERC20
        ? false
        : typeof enabled === "boolean"
        ? enabled
        : !!token?.address,
  });

  return { data: { ...data, ...metadata }, isLoading, isError };
};

export default useToken;
