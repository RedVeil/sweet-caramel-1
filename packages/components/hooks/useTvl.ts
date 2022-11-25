import { parseEther } from "ethers/lib/utils";
import { usePrice } from "./usePrice";
import { useTotalSupply } from "./useTotalSupply";
import { formatAndRoundBigNumber } from "../../utils/src/formatBigNumber";
import { BigNumber } from "ethers";
import useNamedAccounts from "./useNamedAccounts";

interface UseTvlProps {
  chainId: number;
  address: string;
  priceResolver?: string;
  enabled?: boolean;
}
export const useTvl = ({ chainId, address, priceResolver, enabled }: UseTvlProps) => {
  const { data: price, isValidating, error: priceError } = usePrice(address, chainId, priceResolver);
  const [contract] = useNamedAccounts(String(chainId) as any, [address]);

  const { data: supply, isLoading, error: supplyError } = useTotalSupply({
    address,
    chainId,
    enabled: (typeof enabled !== "undefined" && enabled) || (address && chainId),
  });

  const tvl =
    price && (supply as BigNumber | undefined)
      ? price?.value.mul((supply as unknown) as BigNumber).div(parseEther("1"))
      : undefined;

  return {
    data: {
      value: tvl,
      formatted: tvl && price?.decimals ? formatAndRoundBigNumber(tvl, price?.decimals) : undefined,
    },
    isValidating: isValidating || isLoading,
    error: priceError || supplyError,
  };
};
export default useTvl;
