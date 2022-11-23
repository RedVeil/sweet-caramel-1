import { useNamedAccounts } from "@popcorn/hooks";
import { useToken as _useToken } from "wagmi";
import { PortfolioToken } from "../../reducers/portfolio";

interface UseTokenProps {
  chainId: number;
  token?: PortfolioToken;
  alias?: string;
  enabled?: boolean;
}

export const useToken = ({ chainId, token, enabled, alias }: UseTokenProps) => {
  const [metadata] = useNamedAccounts(chainId.toString() as any, [token?.address]);

  const { data, isLoading, isError } = _useToken({
    chainId,
    address: token?.address as "0x${string}",
    enabled: (typeof enabled === "boolean" ? enabled : true) && !IGNORE_LIST.includes(alias),
  });

  return { data: { ...data, ...metadata }, isLoading, isError };
};

export default useToken;

// these aren't ERC20 tokens, so we don't want to fetch their data otherwise we'll get errors
const IGNORE_LIST = ["rewardsEscrow", "threeXStaking", "butterStaking", "popUsdcArrakisVaultStaking"];
