import { BigNumber } from "ethers";
import { Pop } from "../types";
import { withBigNumberFormatting } from "../utils/hocs/withBigNumberFormatting";
import { withLoading } from "../utils/hocs/withLoading";
import useLog from "../utils/hooks/useLog";
import { useClaimableBalance } from "./hooks/useClaimableBalance";

const eth_call =
  (Component: Pop.FC<{ data?: BigNumber }>) =>
    ({ ...props }: Pop.StdProps) => {
      const { data, status } = useClaimableBalance(props);
      useLog({ data, "claimableBalanceOf": true, ...props }, [data]);
      return <Component {...props} data={data} status={status} />;
    };

export const ClaimableBalanceOf = eth_call(withBigNumberFormatting(withLoading(({ data }) => <>{data?.formatted}</>)));

export default ClaimableBalanceOf;
