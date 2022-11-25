import { useNamedAccounts } from "../../hooks";
import { useToken as _useToken } from "wagmi";
import { PortfolioToken } from "../../reducers/portfolio";
import { useEffect } from "react";

interface UseTokenProps {
  chainId: number;
  address?: string;
  alias?: string;
  enabled?: boolean;
}

export const useToken = ({ chainId, address, enabled, alias }: UseTokenProps) => {
  const [metadata] = useNamedAccounts(chainId.toString() as any, (!!address && [address]) || []);

  const { data, isLoading, isError } = _useToken({
    chainId,
    address: address as "0x${string}",
    enabled:
      typeof metadata?.isERC20 !== "undefined" && !metadata.isERC20
        ? false
        : typeof enabled === "boolean"
        ? enabled
        : !!address,
  });

  useEffect(() => {
    console.log({ useToken: { data, isLoading, isError, metadata } });
  }, [data, metadata, isLoading, isError]);

  return { data: { ...data }, isLoading, isError };
};

export default useToken;
