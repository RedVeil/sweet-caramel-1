import { ChainId, networkLogos, networkMap } from "@popcorn/utils";
import { AlertCardLink } from "@popcorn/app/components/Common/AlertCard";
import ConnectDepositCard from "@popcorn/app/components/Common/ConnectDepositCard";
import StakeCard from "components/staking/StakeCard";
import { FeatureToggleContext } from "@popcorn/app/context/FeatureToggleContext";
import React, { useContext, useEffect, useMemo, useState } from "react";
import ContentLoader from "react-content-loader";
import { useRouter } from "next/router";
import useAllStakingContracts, { StakingType } from "hooks/staking/useAllStakingContracts";
import useSelectNetwork from "hooks/useSelectNetwork";
import useChainsWithStaking from "hooks/staking/useChainsWithStaking";
import SelectNetwork from "components/SelectNetwork";

export default function StakingOverviewPage(): JSX.Element {
  const { features } = useContext(FeatureToggleContext);
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
            <div className={`mt-10 ${stakingPools ? "hidden" : ""}`}>
              <ContentLoader viewBox="0 0 450 400" backgroundColor={"#EBE7D4"} foregroundColor={"#d7d5bc"}>
                {/*eslint-disable */}
                <rect x="0" y="0" rx="8" ry="8" width="450" height="108" />
                <rect x="0" y="115" rx="8" ry="8" width="450" height="108" />
                <rect x="0" y="230" rx="8" ry="8" width="450" height="108" />
                {/*eslint-enable */}
              </ContentLoader>
            </div>
            {stakingPools && stakingPools.length > 0 && stakingPools?.map(staking =>
              <StakeCard
                key={staking?.chainId + staking?.address}
                chainId={staking?.chainId}
                stakingAddress={staking?.address}
                stakingType={staking?.stakingType}
                badge={
                  features["migrationAlert"] &&
                    staking?.address === "0xe6f315f4e0db78185239fffb368d6d188f6b926c"
                    ? {
                      text: "Migration Required",
                      textColor: "text-white",
                      bgColor: "bg-red-500",
                    }
                    : undefined
                }
              />)}
          </div>
        </div>
      </div>
    </>
  );
}
