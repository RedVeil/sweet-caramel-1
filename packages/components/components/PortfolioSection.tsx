import type { BigNumberWithFormatted, Pop } from "@popcorn/components/lib/types";
import { BigNumber, constants } from "ethers";
import { useState } from "react";

import { NetworkSticker } from "@popcorn/app/components/NetworkSticker";
import TokenIcon from "@popcorn/app/components/TokenIcon";
import { InfoIconWithTooltip } from "@popcorn/app/components/InfoIconWithTooltip";
import { formatAndRoundBigNumber } from "@popcorn/utils";

import { NotAvailable } from "@popcorn/app/components/Rewards/NotAvailable";
import NetworkIconList from "../../greenfield-app/components/NetworkIconList";
import { getPercentage } from "../lib/utils/numbers";
import { Contract } from "../lib";

function PortfolioSection({
  selectedNetworks,
  selectedSections,
  children,
  balance,
  networth,
  title,
}: {
  selectedNetworks: any;
  selectedSections: string[];
  children: any;
  title: string;
  networth: BigNumber;
  balance?: BigNumber;
}) {
  const balanceGTZero = balance?.gt(0);
  const networkListComponent = (
    <div className="flex items-center gap-5">
      <h2 className="text-2xl md:text-3xl leading-6 md:leading-8 font-normal">{title}</h2>
      <NetworkIconList networks={selectedNetworks} />
    </div>
  );

  const showSection = selectedSections.includes(title);
  const distribution = getPercentage(networth, balance);
  return (
    <section className={`px-4 md:px-8 ${showSection || "hidden"}`}>
      <div className={`mt-8 mb-2 md:hidden`}>{networkListComponent}</div>
      <div className="overflow-x-auto">
        <table className={`table w-full table-fixed border-separate border-spacing-y-4`}>
          <thead>
            <tr
              data-dev-note="relative - fixes sticky position issue by children tooltip"
              className="whitespace-nowrap relative"
            >
              <th className="w-[14rem] md:w-[36rem] opacity-0 md:opacity-100">{networkListComponent}</th>
              <th className="hidden lg:table-cell text-primary text-lg font-medium py-4 px-2">
                <div className="flex items-center gap-2">
                  <p className="text-primaryLight text-sm md:text-base">Price</p>
                </div>
                <div className="text-white">.</div>
              </th>
              <th className="w-[8rem] md:w-auto text-primary text-lg font-medium px-2">
                <div className="flex items-center gap-2">
                  <p className="text-primaryLight text-sm md:text-base">Allocation</p>
                  <InfoIconWithTooltip
                    classExtras=""
                    id="portfolio-percentage-tooltip"
                    title="Allocation"
                    content="The percentage weight of your holding."
                  />
                </div>
                <div className="text-left text-sm md:text-lg">{distribution}%</div>
              </th>
              <th className="w-[8rem] md:w-auto text-primary text-lg font-medium px-2">
                <div className="flex items-center space-x-2">
                  <p className="text-primaryLight text-sm md:text-base">Balance</p>
                  <InfoIconWithTooltip
                    classExtras=""
                    id="portfolio-balance-tooltip"
                    title="Balance"
                    content="The value of your position in USD equivalent."
                  />
                </div>
                <div className="text-left text-sm md:text-lg">
                  ${formatAndRoundBigNumber(balance || constants.Zero, 18)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      <div className={`mb-8 ${balanceGTZero && "hidden"}`}>
        <NotAvailable title={`No ${title} available`} body={""} image="/images/emptyRecord.svg" />
      </div>
    </section>
  );
}

function AssetCell({ children, as: Wrapper = "td", className }: { children: any; as?: any; className?: string }) {
  return (
    <Wrapper
      className={`text-primary text-sm md:text-lg font-medium md:bg-customLightGray md:bg-opacity-[10%] px-2 md:py-4 ${className}`}
    >
      {children}
    </Wrapper>
  );
}

const ZERO = constants.Zero;
export function AssetRow({
  chainId,
  badge,
  token,
  networth,
  price,
  balance,
  callback,
  status,
  name,
}: Partial<{
  chainId: any;
  badge: any;
  address: string;
  networth?: BigNumber;
  price: BigNumberWithFormatted;
  balance: BigNumberWithFormatted;
  callback;
  name: string;
  token: Pop.NamedAccountsMetadata;
  status;
}>) {
  const [rawBalance, setRawBalance] = useState(ZERO);

  const proxyCallback = (value?: BigNumber) => {
    if (value && value.gt(0)) setRawBalance(value);
    callback?.(value);
  };

  return (
    <tr className={`${balance?.value?.gt(0) ? "" : "hidden"}`}>
      <td className="md:bg-customLightGray md:bg-opacity-[10%] rounded-l-2xl py-2 md:py-4 pl-2 md:pl-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <NetworkSticker selectedChainId={chainId} />
            <TokenIcon token={token?.address || ""} chainId={chainId} />
          </div>
          <div className="flex space-x-[6px] md:space-x-[52px]">
            <div>
              <p className="font-medium text-xs md:text-lg">{name}</p>
              <p className="text-tokenTextGray text-[10px] md:text-base">Popcorn</p>
            </div>
          </div>
          {badge}
        </div>
      </td>
      <AssetCell className="hidden lg:table-cell">
        ${formatAndRoundBigNumber(price?.value || constants.Zero, 18)}
      </AssetCell>
      <AssetCell>{getPercentage(networth, rawBalance)}%</AssetCell>
      <AssetCell>
        <Contract.Value status={status} balance={balance?.value} price={price?.value} callback={proxyCallback} />
        <p className="text-tokenTextGray text-[10px] md:text-base">
          {balance?.formatted} {token?.symbol || "POP"}
        </p>
      </AssetCell>
    </tr>
  );
}

export default PortfolioSection;
