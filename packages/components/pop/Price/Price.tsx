import { formatAndRoundBigNumber } from "@popcorn/utils";
import { usePrice } from "./hooks/usePrice";
import { useNamedAccounts } from "../utils";
import { Pop } from "../types";


interface PriceProps {
  resolver?: string;
}
export const PriceOf: Pop.FC<PriceProps> = ({ address, chainId, resolver }) => {
  const [metadata] = useNamedAccounts(chainId.toString() as any, [address]);

  const { data, status } = usePrice({ address, chainId, resolver: resolver || metadata?.priceResolver });

  return <>Price: {(data && `$${formatAndRoundBigNumber(data.value, data.decimals)}`) ?? "Loading ... "}</>;
};

export default PriceOf;
