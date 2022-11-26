import { ChainId } from "packages/utils";
import { useEffect } from "react";
import { useBalance, useComponentState } from "../hooks";
import { PortfolioToken } from "../reducers/portfolio";
import useToken from "../hooks/useToken";
import useLog from '../hooks/utils/useLog';

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

  const { data, isValidating, error: balanceError, isError } = useBalance({ address, chainId, account });


  useEffect(() => {
    if (balanceError) console.log({ balanceError, address, chainId, resolver });
  }, [balanceError]);

  useEffect(() => {
    updateWallet?.({ address, chainId, balance: { data, isValidating, isError: isError, error: balanceError } });
  }, [data, isValidating, balanceError]);

  return (
    <>
      {!isValidating && (
        <div>
          Balance: {data?.formatted} ({symbol}){" "}
        </div>
      )}
    </>
  );
};
