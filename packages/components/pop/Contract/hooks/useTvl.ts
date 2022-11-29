import { parseEther } from "ethers/lib/utils";
import { usePrice } from "../../Price/hooks/usePrice";
import { useTotalSupply } from "../../Erc20/hooks/useTotalSupply";
import { formatAndRoundBigNumber } from "@popcorn/utils/src/formatBigNumber";
import { BigNumber } from "ethers";
import { BigNumberWithFormatted, Pop } from "../../types";
import useNamedAccounts from "../../utils/hooks/useNamedAccounts";
import { useMultiStatus } from "../../utils/hooks/useMultiStatus";

interface UseTvlProps {
  chainId: number;
  address: string;
  priceResolver?: string;
  enabled?: boolean;
  resolver?: string;
}
export const useTvl: Pop.Hook<BigNumberWithFormatted> = ({ chainId, address, resolver, enabled }: UseTvlProps) => {
  const [metadata] = useNamedAccounts(chainId.toString() as any, [address]);
  const _priceResolver = resolver || metadata?.priceResolver;
  const _enabled = typeof enabled !== "undefined" ? !!enabled && !!chainId && !!address : !!chainId && !!address;

  const { data: price, status: priceStatus } = usePrice({
    address,
    chainId,
    resolver: _priceResolver,
    enabled: _enabled,
  });

  const { data: supply, status: supplyStatus } = useTotalSupply({
    address,
    chainId,
    enabled: _enabled && priceStatus === "success",
  });

  const tvl =
    price && (supply as BigNumber | undefined)
      ? price?.value.mul(supply as unknown as BigNumber).div(parseEther("1"))
      : undefined;

  const status = useMultiStatus([priceStatus, supplyStatus]);

  return {
    data: {
      value: tvl,
      formatted: tvl && price?.decimals ? formatAndRoundBigNumber(tvl, price?.decimals) : undefined,
    },
    status: status,
  };
};
export default useTvl;
