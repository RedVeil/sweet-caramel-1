import { formatAndRoundBigNumber } from "@popcorn/utils";
import { usePrice } from "./hooks/usePrice";
import { useNamedAccounts } from "../utils";
import { Pop } from "../types";


interface PriceProps {
  resolver?: string;
}

export const PriceOf: Pop.FC<PriceProps> = ({ address, chainId, resolver }) => {
  const [metadata] = useNamedAccounts(chainId.toString() as any, [address]);

  const { data } = usePrice({ address, chainId, resolver: resolver || metadata?.priceResolver });

  return <>{data?.value && `$${formatAndRoundBigNumber(data?.value, data?.decimals)}`}</>;
};

export default PriceOf;
