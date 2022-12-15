/**
 * Set explicit import type.
 * @see https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export
 */
import type { Pop } from "../../lib/types";
import { networkLogos } from "@popcorn/utils";
import TokenIcon from "@popcorn/app/components/TokenIcon";

import PortfolioItem from "./PortfolioItem";
import { useNetworth } from "../../context/Networth";
import { useComponentState } from "../../lib/utils/hooks";
import useContractMetadata from "../../lib/Contract/hooks/useContractMetadata";
import { Price, Contract } from "../../lib/";

interface ContractProps extends Pop.NamedAccountsMetadata {
  alias?: string;
  children?: React.ReactElement[];
  index?: number;
  account: string;
}

export const PortfolioItemsContainer: Pop.FC<ContractProps> = ({
  address,
  chainId,
  children,
  alias,
  index,
  account,
}) => {
  const { data, status } = useContractMetadata({ chainId, address, alias });

  const { ready } = useComponentState({ ready: !!data, loading: status === "loading" });

  const { symbol, priceResolver, apyResolver, balanceResolver, decimals, name, icons, alias: _alias } = data || {};
  const { dispatch, state: _state } = useNetworth();
  const { value: stateValue, status: stateStatus } = _state[address || ""] || {};

  const portfolioValues = [
    {
      value: <Price.PriceOf address={address} chainId={chainId} />,
      hideMobile: true,
    },
    {
      value: <Contract.PercentBalanceOf address={address} chainId={chainId} account={account} balance={stateValue} />,
      hideMobile: false,
    },
    {
      value: (
        <>
          <Contract.BalanceOf address={address} chainId={chainId} account={account} />
          <p className="text-tokenTextGray text-[10px] md:text-base">
            <Contract.TokenBalanceOf
              address={address}
              chainId={chainId}
              account={account}
              symbol={symbol ? ` ${symbol}` : ""}
            />
          </p>
        </>
      ),
      hideMobile: false,
    },
  ];
  return (
    <>
      {!!ready && (
        <div className="mb-4">
          <PortfolioItem
            tokenName={symbol || ""}
            tokenIcon={<TokenIcon token={address || ""} chainId={chainId} />}
            contractIcon={networkLogos[chainId]}
            token={alias || ""}
            portfolioValues={portfolioValues}
          />
        </div>
      )}
    </>
  );
};

export default PortfolioItemsContainer;
