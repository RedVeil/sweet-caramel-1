import { BigNumber } from "ethers";
import { usePrice } from "../Price";
import { Pop } from "../types";
import { withBigNumberFormatting } from "../utils/hocs/withBigNumberFormatting";
import { withLoading } from "../utils/hocs/withLoading";
import { useClaimableBalance } from "./hooks/useClaimableBalance";
import { useClaimableToken } from "./hooks/useClaimableToken";

const eth_call =
  (Component: Pop.FC<{ data?: BigNumber }>) =>
    ({
      ...props
    }: Pop.StdProps & {
      render?: (props: {
        price?: BigNumber;
        address?: string;
        chainId?: Number;
        balance?: BigNumber;
        decimals?: number;
      }) => React.ReactElement;
    }) => {
      const { data: token } = useClaimableToken(props);
      const { data, status } = useClaimableBalance(props);
      const { data: price } = usePrice({ ...props, address: token });
      if (props.render) {
        return (
          <>
            {props.render({
              price: price?.value,
              address: token,
              chainId: props.chainId,
              balance: data,
              decimals: price?.decimals
            })}
          </>
        );
      }
      return <Component {...props} data={data} status={status} />;
    };

export const ClaimableBalanceOf = eth_call(withBigNumberFormatting(withLoading(({ data }) => <>{data?.formatted}</>)));

export default ClaimableBalanceOf;
