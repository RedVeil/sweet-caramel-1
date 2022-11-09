import { ChainId, networkLogos, networkMap } from "@popcorn/utils";
import { AlertCardLink } from "@popcorn/app/components/Common/AlertCard";
import ConnectDepositCard from "@popcorn/app/components/Common/ConnectDepositCard";
import StakeCard from "@popcorn/app/components/StakeCard";
import { FeatureToggleContext } from "@popcorn/app/context/FeatureToggleContext";
import React, { useContext, useEffect, useMemo, useState } from "react";
import ContentLoader from "react-content-loader";
import { useRouter } from "next/router";
import useAllStakingContracts from "hooks/staking/useAllStakingContracts";

const MIGRATION_LINKS: AlertCardLink[] = [
  { text: "How to migrate", url: "https://medium.com/popcorndao/pop-on-arrakis-8a7d7d7f1948", openInNewTab: true },
];

const SUPPORTED_NETWORKS = [ChainId.Ethereum, ChainId.Polygon, ChainId.Localhost]

export default function StakingOverviewPage(): JSX.Element {
  const [selectedNetworks, selectNetworks] = useState<ChainId[]>(SUPPORTED_NETWORKS)
  const router = useRouter();
  const { features } = useContext(FeatureToggleContext);
  const stakingContracts = useAllStakingContracts();

  // reset when all chains get deselected
  useEffect(() => {
    if (selectedNetworks.length === 0) selectNetworks(SUPPORTED_NETWORKS)
  }, [selectedNetworks])


  const popLocker = useMemo(
    () => stakingContracts?.popStaking?.filter(staking => selectedNetworks.includes(staking?.contract?.provider?._network?.chainId)),
    [selectedNetworks, stakingContracts?.popStaking])
  const stakingPools = useMemo(
    () => stakingContracts?.stakingPools?.filter(staking => selectedNetworks.includes(staking?.contract?.provider?._network?.chainId)),
    [selectedNetworks, stakingContracts?.stakingPools])



  function selectNetwork(chainId: ChainId): void {
    let newSelectedNetworks;
    if (selectedNetworks.length === SUPPORTED_NETWORKS.length) {
      newSelectedNetworks = [chainId]
    } else if (selectedNetworks.includes(chainId)) {
      newSelectedNetworks = selectedNetworks.filter(chain => chain !== chainId)
    } else {
      newSelectedNetworks = [...selectedNetworks, chainId]
    }
    selectNetworks(newSelectedNetworks)
  }

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
      <div className="flex flex-row items-center space-x-2">
        <p className="text-lg mr-4">Selected Networks:</p>
        {SUPPORTED_NETWORKS.map(network =>
          <button key={network}
            onClick={() => selectNetwork(network)}
            className={`${selectedNetworks.includes(network) ? "bg-warmGray" : "bg-white"} h-8 w-12 border border-customLightGray rounded-4xl text-primary cursor-pointer`}>
            <img src={networkLogos[network]} alt={ChainId[network]} className="w-4.5 h-4 mx-auto" />
          </button>)}
      </div>
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
            {popLocker?.map(pool =>
              <StakeCard
                key={pool.contract.provider._network.chainId + pool.address}
                chainId={pool.contract.provider._network.chainId}
                stakingPool={pool}
                stakedToken={pool?.stakingToken}
                onSelectPool={() => router?.push(`/${networkMap[pool.contract.provider._network.chainId]?.toLowerCase()}/staking/pop`)}
                badge={undefined}
              />)}
            {stakingPools?.map(pool =>
              <StakeCard
                key={pool.contract.provider._network.chainId + pool.address}
                chainId={pool.contract.provider._network.chainId}
                stakingPool={pool}
                stakedToken={pool?.stakingToken}
                onSelectPool={() => router?.push(`/${networkMap[pool.contract.provider._network.chainId]?.toLowerCase()}/staking/${pool.address}`)}
                badge={
                  features["migrationAlert"] &&
                    pool.address === "0xe6f315f4e0db78185239fffb368d6d188f6b926c"
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
      {/* <FooterLandScapeImage /> */}
    </>
  );
}
