import ConnectDepositCard from "@popcorn/app/components/Common/ConnectDepositCard";
import StakeCard from "components/staking/StakeCard";
import React, { useMemo } from "react";
import useAllStakingContracts from "hooks/staking/useAllStakingContracts";
import useSelectNetwork from "hooks/useSelectNetwork";
import useChainsWithStaking from "hooks/staking/useChainsWithStaking";
import SelectNetwork from "components/SelectNetwork";

export default function StakingOverviewPage(): JSX.Element {
  const stakingContracts = useAllStakingContracts();
  const supportedNetworks = useChainsWithStaking()
  const [selectedNetworks, selectNetwork] = useSelectNetwork(supportedNetworks)

  const stakingPools = useMemo(
    () => stakingContracts?.stakingPools?.filter(staking => selectedNetworks.includes(staking?.chainId)),
    [selectedNetworks, stakingContracts])

  return (
    <>
      <div className="grid grid-cols-12">
        <div className="col-span-12 md:col-span-4">
          <h1 className=" text-5xl md:text-6xl leading-12">Staking</h1>
          <p className="text-black mt-2">Earn more by staking your tokens</p>
        </div>
        <div className="col-span-12 md:col-span-6 md:col-end-13 mt-12 md:mt-0">
          <ConnectDepositCard />
        </div>
      </div>
      <SelectNetwork supportedNetworks={supportedNetworks} selectedNetworks={selectedNetworks} selectNetwork={selectNetwork} />
      <div className="mt-12 border-t border-t-customLightGray">
        <div className="w-full">
          <div className="h-full ">
            {stakingPools && stakingPools.length > 0 && stakingPools?.map(staking =>
              <StakeCard
                key={staking.chainId + staking.address}
                chainId={staking?.chainId}
                stakingAddress={staking?.address}
                stakingType={staking?.stakingType}
              />)}
          </div>
        </div>
      </div>
    </>
  );
}
