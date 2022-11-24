import { NotAvailable } from "@popcorn/app/components/Rewards/NotAvailable";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import { ChainId } from "@popcorn/utils";
import { constants } from "ethers";
import useAllStakingAddresses from "hooks/staking/useAllStakingAddresses";
import { useChainsWithStakingRewards } from "hooks/staking/useChainsWithStaking";
import useSum from "hooks/useSum";
import { useEffect, useState } from "react";
import Vesting from "./Vesting";

interface VestingContainerProps {
  selectedNetworks: ChainId[];
}

export default function VestingContainer({ selectedNetworks }: VestingContainerProps): JSX.Element {
  const { account } = useWeb3();
  const supportedNetworks = useChainsWithStakingRewards();
  const { loading, sum, add, reset } = useSum({ expected: selectedNetworks.length });

  useEffect(() => {
    reset();
  }, [account, selectedNetworks]);

  return (
    <>
      <div className={`mb-4 ${!loading && sum?.eq(constants.Zero) ? "" : "hidden"}`}>
        <NotAvailable
          title="No Records Available"
          body="No vesting records available"
          image="/images/emptyRecord.svg"
        />
      </div>
      {supportedNetworks
        .filter((chain) => selectedNetworks.includes(chain))
        .map((chain) => (
          <Vesting key={chain + "Vesting"} chainId={chain} addClaimable={add} />
        ))}
    </>
  );
}
