import { parseEther } from "ethers/lib/utils";
import { usePrice } from "../../Price/hooks/usePrice";
import { useTotalSupply } from "../../Erc20/hooks/useTotalSupply";
import { formatAndRoundBigNumber } from "@popcorn/utils/src/formatBigNumber";
import { BigNumber } from "ethers";
import { BigNumberWithFormatted, Pop } from "../../types";
import useNamedAccounts from "../../utils/hooks/useNamedAccounts";

interface UseTvlProps {
  chainId: number;
  address: string;
  priceResolver?: string;
  enabled?: boolean;
}
export const useTvl: Pop.Hook<BigNumberWithFormatted> = ({ chainId, address, priceResolver, enabled }: UseTvlProps) => {
  const [metadata] = useNamedAccounts(chainId.toString() as any, [address]);
  const _enabled = typeof enabled !== "undefined" ? !!enabled && !!chainId && !!address : !!chainId && !!address;

  const { data: price, status } = usePrice({
    address,
    chainId,
    resolver: priceResolver || (metadata?.priceResolver && metadata?.priceResolver) || undefined,
    enabled: _enabled,
  });

  const { data: supply, status: supplyStatus } = useTotalSupply({
    address,
    chainId,
    enabled: (_enabled && status === "success") || status === "success",
  });

  const tvl =
    price && (supply as BigNumber | undefined)
      ? price?.value.mul(supply as unknown as BigNumber).div(parseEther("1"))
      : undefined;

  return {
    data: {
      value: tvl,
      formatted: tvl && price?.decimals ? formatAndRoundBigNumber(tvl, price?.decimals) : undefined,
    },
    status: [status, supplyStatus].includes("error") ? "error" : supplyStatus,
  };
};
export default useTvl;
