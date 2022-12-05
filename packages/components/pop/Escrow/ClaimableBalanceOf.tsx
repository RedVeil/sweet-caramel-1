import { BigNumber } from "ethers";
import { usePrice } from "../Price";
import { BigNumberWithFormatted, Pop } from "../types";
import { withLoading } from "../utils/hocs/withLoading";
import useLog from "../utils/hooks/useLog";
import { useEscrowIds } from "./hooks";
import { useClaimableBalance } from "./hooks/useClaimableBalance";
import { useClaimableToken } from "./hooks/useClaimableToken";

const eth_call =
  (Component: Pop.FC<BigNumberWithFormatted>) =>
    ({ ...props }: Pop.StdProps & {
      render?: (props: {
        price?: BigNumber;
        address?: string;
        chainId?: Number;
        balance?: BigNumber;
        decimals?: number;
      }) => React.ReactElement;
    }) => {
      const { data: token } = useClaimableToken({ ...props });
      const { data: price } = usePrice({ ...props, address: token });
      const { data: ids, status: idsStatus } = useEscrowIds({ ...props });
      const { data: claimableBalance, status } = useClaimableBalance({ ...props, enabled: idsStatus === "success", escrowIds: ids });
      if (props.render) {
        return (
          <>
            {props.render({
              price: price?.value,
              address: token,
              chainId: props.chainId,
              balance: claimableBalance?.value,
            })}
          </>
        );
      }
      return <Component {...props} data={claimableBalance} status={status} />;
    };

export const ClaimableBalanceOf = eth_call(withLoading(({ data }) => <>{data?.formatted}</>));

export default ClaimableBalanceOf;
