import { ChainId } from "packages/utils";
import { useEffect } from "react";
import { useBalance, useComponentState } from "../hooks";
import { PortfolioToken } from "../reducers/portfolio";
import useToken from "../hooks/useToken";

interface BalanceProps {
  address: string;
  chainId: ChainId;
  account?: `0x${string}`;
  resolver?: string;
  updateWallet?: (args: PortfolioToken) => void;
}

export const Balance: React.FC<BalanceProps> = ({ address, chainId, resolver, account, updateWallet }) => {
  const {
    data: { symbol },
  } = useToken({ chainId, token: address });
  const { data, isValidating, error: apyError, isError } = useBalance({ address, chainId, account });

  const { ready, loading } = useComponentState({
    ready: !!address && !!chainId && !!account && data?.value,
    loading: !account || !address,
  });

  useEffect(() => {
    if (apyError) console.log({ apyError, address, chainId, resolver });
  }, [apyError]);

  useEffect(() => {
    updateWallet?.({ address, chainId, balance: { data, isValidating, isError: isError, error: apyError } });
  }, [data, isValidating, apyError]);

  return (
    <>
      {loading && "Loading ..."}
      {!loading && ready && (
        <div>
          Balance: {data?.formatted} ({symbol}){" "}
        </div>
      )}
    </>
  );
};
