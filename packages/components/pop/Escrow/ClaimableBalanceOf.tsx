import { BigNumberWithFormatted, Pop } from "../types";
import { withLoading } from "../utils/hocs/withLoading";
import { useEscrowIds } from "./hooks";
import { useClaimableBalance } from "./hooks/useClaimableBalance";

const eth_call =
  (Component: Pop.FC<BigNumberWithFormatted>) =>
  ({ ...props }: Pop.BaseContractProps) => {
    const { data: ids, status: idsStatus } = useEscrowIds({ ...props });
    const { data, status } = useClaimableBalance({ ...props, enabled: idsStatus === "success", escrowIds: ids });
    return <Component {...props} data={data} status={status} />;
  };

export const ClaimableBalanceOf = eth_call(withLoading(({ data }) => <>{data?.formatted}</>));

export default ClaimableBalanceOf;
