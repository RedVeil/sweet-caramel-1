import { useEscrowBalance } from "./hooks/useEscrowBalance";
import { BigNumberWithFormatted } from "../../reducers/portfolio/reducer";
import { Pop } from "../types";
import { useEscrowIds } from "./hooks/useEscrowIds";
import useLog from "../utils/useLog";

export const withEscrowBalanceOf = (Component: Pop.WagmiFC<BigNumberWithFormatted>) => {
  const WithEscrowBalance = ({ ...props }: Pop.BaseContractProps) => {
    const { address, chainId, account, enabled } = props;

    useLog({ withEscrowBalance: address, chainId, account, enabled }, [address, chainId, account, enabled]);

    const { data: ids, status: idsStatus } = useEscrowIds({ address, chainId, account, enabled });

    const { data, status } = useEscrowBalance({ address, chainId, account, enabled: idsStatus === 'success', escrowIds: ids });

    return <Component {...props} data={data} status={status} />;
  };
  return WithEscrowBalance;
};

export default withEscrowBalanceOf;