import { networkMap } from "@popcorn/utils";
import { useComponentState } from "../../lib/utils/hooks";
import { Pop } from "../../lib/types";
import useContractMetadata from "../../lib/Contract/hooks/useContractMetadata";
import PortfolioItem from "../PortfolioItem";
import { networkLogos } from "@popcorn/utils";
import { Escrow, Erc20, Price, Contract, Staking } from "../../lib/";
import TokenIcon from "@popcorn/app/components/TokenIcon";
import { BalanceOf } from "@popcorn/components/lib/Contract";

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

  const portfolioValues = [
    {
      value: <Price.PriceOf key={`Price.PriceOf`} address={address} chainId={chainId} />,
      hideMobile: true,
    },
    {
      value: "0.1234%",
      hideMobile: false,
    },
    {
      value: (
        <>
          <BalanceOf key={`Contract.BalanceOf`} address={address} chainId={chainId} account={account} />
          <p className="text-tokenTextGray text-[10px] md:text-base">10K POP</p>
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
