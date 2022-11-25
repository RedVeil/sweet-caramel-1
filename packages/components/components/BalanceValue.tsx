import { ChainId } from "packages/utils";
import { useBalanceValue } from "../hooks/portfolio/useBalanceValue";
import { useUpdateWallet } from "../hooks/portfolio/useUpdateWalletBalance";
import { PortfolioToken, UpdateWalletBalanceActionProps } from "../reducers/portfolio";

interface BalanceValue {
  address: string;
  chainId: ChainId;
  account?: `0x${string}`;
  price?: PortfolioToken["price"];
  balance?: PortfolioToken["balance"];
  decimals?: number;
  updateWallet?: (args: UpdateWalletBalanceActionProps) => void;
  add?: (amount) => void;
}

export const BalanceValue: React.FC<BalanceValue> = ({ address, chainId, account, price, balance, updateWallet }) => {
  const { data, isValidating, error, isError } = useBalanceValue({
    enabled: !!address && !!chainId && !!account && !!price && !!balance,
    address,
    chainId,
    price: price?.data?.value,
    account,
    balance: balance?.data?.value,
  });

  const loading = !data?.value && isValidating;

  useUpdateWallet({
    chainId,
    account,
    token: address,
    property: ["balanceValue", { data, isError, error, isValidating }],
    updateWallet,
  });

  return (
    <>
      {loading && "Loading ..."}
      {data?.value && <div>Balance Value: {data?.formatted} </div>}
    </>
  );
};

export default BalanceValue;
