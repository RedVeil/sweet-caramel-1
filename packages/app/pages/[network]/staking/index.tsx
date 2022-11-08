import { ChainId, networkLogos, networkMap } from "@popcorn/utils";
import { Address } from "@popcorn/utils/src/types";
import AlertCard, { AlertCardLink } from "@popcorn/app/components/Common/AlertCard";
import ConnectDepositCard from "@popcorn/app/components/Common/ConnectDepositCard";
import StakeCard from "@popcorn/app/components/StakeCard";
import { FeatureToggleContext } from "@popcorn/app/context/FeatureToggleContext";
import usePopLocker from "@popcorn/app/hooks/staking/usePopLocker";
import React, { useContext, useEffect, useState } from "react";
import ContentLoader from "react-content-loader";
import { NotAvailable } from "@popcorn/app/components/Rewards/NotAvailable";
import { useChainIdFromUrl } from "@popcorn/app/hooks/useChainIdFromUrl";
import usePushWithinChain from "@popcorn/app/hooks/usePushWithinChain";
import { useAllStakingPools } from "@popcorn/app/hooks/useAllStakingPools";
import { useRouter } from "next/router";

const MIGRATION_LINKS: AlertCardLink[] = [
  { text: "How to migrate", url: "https://medium.com/popcorndao/pop-on-arrakis-8a7d7d7f1948", openInNewTab: true },
];

export default function StakingOverviewPage(): JSX.Element {
  //const { data: popLocker, isValidating: popLockerIsValidating, error: popError } = usePopLocker(popStaking, chainId);

  const { stakingPools, stakingPoolsIsValidating } = useAllStakingPools();

  const { features } = useContext(FeatureToggleContext);

  const router = useRouter();

  const logo = (chainId) => networkLogos[chainId];
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
      {/*
      {features["migrationAlert"] && chainId === ChainId.Polygon && (
        <div className="mt-10 md:mt-20">
          <AlertCard
            title="Migrate your liquidity for USDC/POP from Sushiswap to Arrakis"
            text="In PIP-2 the community decided to migrate all Polygon liquidity to Uniswap via Arrakis."
            links={MIGRATION_LINKS}
          />
        </div>
      )}
      */}
      <div className="mt-12 border-t border-t-customLightGray">
        <div className="w-full">
          <div className="h-full ">
            <div className={`mt-10 ${!stakingPools ? "" : "hidden"}`}>
              <ContentLoader viewBox="0 0 450 400" backgroundColor={"#EBE7D4"} foregroundColor={"#d7d5bc"}>
                {/*eslint-disable */}
                <rect x="0" y="0" rx="8" ry="8" width="450" height="108" />
                <rect x="0" y="115" rx="8" ry="8" width="450" height="108" />
                <rect x="0" y="230" rx="8" ry="8" width="450" height="108" />
                {/*eslint-enable */}
              </ContentLoader>
            </div>
            <span className={`${!stakingPools ? "hidden" : ""}`}>
              {stakingPools?.map(({ chainId, pool }) => (
                <div key={chainId + pool.address}>
                  <StakeCard
                    chainId={chainId}
                    stakingPool={pool}
                    stakedToken={pool?.stakingToken}
                    onSelectPool={() => router?.push(`/${networkMap[chainId]?.toLowerCase()}/staking/${pool.address}`)}
                    networkLogo={logo(chainId)}
                    badge={
                      features["migrationAlert"] &&
                      pool.address === "0xe6f315f4e0dB78185239fFFb368D6d188f6b926C" &&
                      chainId === ChainId.Polygon
                        ? {
                            text: "Migration Required",
                            textColor: "text-white",
                            bgColor: "bg-red-500",
                          }
                        : undefined
                    }
                  />
                </div>
              ))}
            </span>
          </div>
        </div>
      </div>
      {/* <FooterLandScapeImage /> */}
    </>
  );
}
