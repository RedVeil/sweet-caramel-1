import type { Pop } from "@popcorn/components/lib/types";
import { NetworkSticker } from "@popcorn/app/components/NetworkSticker";
import TokenIcon from "@popcorn/app/components/TokenIcon";

import PortfolioItem from "./PortfolioItem";
import { useNetworth } from "../../context/Networth";
import { useComponentState } from "../../lib/utils/hooks";
import { Price, Contract } from "../../lib/";
import useContractMetadata from "../../lib/Contract/hooks/useContractMetadata";

interface ContractProps extends Pop.NamedAccountsMetadata {
  alias?: string;
  children?: React.ReactElement[];
  index?: number;
  account?: string;
}

export const PortfolioItemsContainer: Pop.FC<ContractProps> = ({ address, chainId, alias, account }) => {
  const { data, status } = useContractMetadata({ chainId, address, alias });

  const { ready } = useComponentState({ ready: !!data, loading: status === "loading" });

  const { symbol, alias: _alias } = data || {};
  const { state: _state } = useNetworth();
  const { value: stateValue, status: stateStatus } = _state.total.address ?? {};

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
          <Contract.BalanceOf address={address} chainId={chainId} />
          <div className="text-tokenTextGray text-[10px] md:text-base">
            {" "}
            <Contract.TokenBalanceOf
              address={address}
              chainId={chainId}
              account={account}
              symbol={symbol ? ` ${symbol}` : ""}
            />
          </div>
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
            networkSticker={<NetworkSticker selectedChainId={chainId} />}
            token={alias || ""}
            portfolioValues={portfolioValues}
          />
        </div>
      )}
    </>
  );
};

export default PortfolioItemsContainer;
