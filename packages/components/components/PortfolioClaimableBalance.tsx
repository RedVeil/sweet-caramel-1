import type { Pop } from "@popcorn/components/lib/types";
import { Fragment } from "react";
import { BigNumber, constants } from "ethers";

import { Badge, BadgeVariant } from "@popcorn/components/components/Badge";

import { Escrow } from "../lib";
import { AssetRow } from "../components/PortfolioSection";

function PortfolioClaimableBalance({
  token,
  account,
  networth,
  callback,
}: {
  token: Pop.NamedAccountsMetadata;
  account?: string;
  networth: BigNumber;
  callback: any;
}) {
  const chainId = Number(token.chainId);
  let mutableClaimableBalance = constants.Zero;

  const sharedProps = {
    address: token.address,
    account: account as any,
    chainId,
    networth,
    token,
  };

  return (
    <Escrow.ClaimableBalanceOf
      {...sharedProps}
      render={({ balance: claimableBalance, price, status }) => (
        <Fragment>
          <AssetRow
            {...sharedProps}
            badge={<Badge variant={BadgeVariant.primary}>Claimable</Badge>}
            callback={(value) => (mutableClaimableBalance = value)}
            name={token.symbol || "Popcorn"}
            balance={claimableBalance}
            status={status}
            price={price}
          />
          <Escrow.VestingBalanceOf
            {...sharedProps}
            render={({ balance: vestingBalance, price, status }) => (
              <AssetRow
                {...sharedProps}
                badge={<Badge variant={BadgeVariant.dark}>Vesting</Badge>}
                callback={(value) => callback(value.add(mutableClaimableBalance))}
                name="Popcorn"
                balance={vestingBalance}
                status={status}
                price={price}
              />
            )}
          />
        </Fragment>
      )}
    />
  );
}

export default PortfolioClaimableBalance;
