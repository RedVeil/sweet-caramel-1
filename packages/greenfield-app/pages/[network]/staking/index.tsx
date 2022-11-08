import { ChainId, networkLogos, networkMap } from "@popcorn/utils";
import { Address } from "@popcorn/utils/src/types";
import AlertCard, { AlertCardLink } from "@popcorn/app/components/Common/AlertCard";
import ConnectDepositCard from "@popcorn/app/components/Common/ConnectDepositCard";
import StakeCard from "@popcorn/app/components/StakeCard";
import { FeatureToggleContext } from "@popcorn/app/context/FeatureToggleContext";
import usePopLocker from "@popcorn/app/hooks/staking/usePopLocker";
import React, { useContext, useEffect, useMemo, useState } from "react";
import ContentLoader from "react-content-loader";
import { NotAvailable } from "@popcorn/app/components/Rewards/NotAvailable";
import { useChainIdFromUrl } from "@popcorn/app/hooks/useChainIdFromUrl";
import usePushWithinChain from "@popcorn/app/hooks/usePushWithinChain";
import { useAllStakingPools } from "@popcorn/app/hooks/useAllStakingPools";
import { useRouter } from "next/router";
import { useStakingContracts } from "@popcorn/app/hooks/useStakingContracts";
import useGetMultipleStakingPools from "@popcorn/app/hooks/staking/useGetMultipleStakingPools";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import { useNetwork } from "wagmi";

const MIGRATION_LINKS: AlertCardLink[] = [
  { text: "How to migrate", url: "https://medium.com/popcorndao/pop-on-arrakis-8a7d7d7f1948", openInNewTab: true },
];

const SUPPORTED_NETWORKS = [ChainId.Ethereum, ChainId.Polygon, ChainId.Localhost]

export default function StakingOverviewPage(): JSX.Element {
  const [selectedNetworks, selectNetworks] = useState<ChainId[]>(SUPPORTED_NETWORKS)

  // reset when all chains get deselected
  useEffect(() => {
    if (selectedNetworks.length === 0) selectNetworks(SUPPORTED_NETWORKS)
  }, [selectedNetworks])

  // Ethereum
  const { popStaking: ethereumPopStaking } = useDeployment(ChainId.Ethereum);
  const { data: ethereumPopLocker, isValidating: ethereumPopLockerIsValidating, error: ethereumPopLockerError } = usePopLocker(ethereumPopStaking, ChainId.Ethereum);
  const ethereumStakingAddresses = useStakingContracts(ChainId.Ethereum);
  const { data: ethereumStakingPools, isValidating: ethereumStakingPoolsIsValidating } = useGetMultipleStakingPools(
    ethereumStakingAddresses,
    ChainId.Ethereum,
  );

  // Polygon
  const { popStaking: polygonPopStaking } = useDeployment(ChainId.Polygon);
  const { data: polygonPopLocker, isValidating: polygonPopLockerIsValidating, error: polygonPopLockerError } = usePopLocker(polygonPopStaking, ChainId.Polygon);
  const polygonStakingAddresses = useStakingContracts(ChainId.Polygon);
  const { data: polygonStakingPools, isValidating: polygonStakingPoolsIsValidating } = useGetMultipleStakingPools(
    polygonStakingAddresses,
    ChainId.Polygon,
  );

  // Localhost
  const { popStaking: localhostPopStaking } = useDeployment(ChainId.Localhost);
  const { data: localhostPopLocker, isValidating: localhostPopLockerIsValidating, error: localhostPopLockerError } = usePopLocker(localhostPopStaking, ChainId.Localhost);
  const localhostStakingAddresses = useStakingContracts(ChainId.Localhost);
  const { data: localhostStakingPools, isValidating: localhostStakingPoolsIsValidating } = useGetMultipleStakingPools(
    localhostStakingAddresses,
    ChainId.Localhost,
  );

  const { features } = useContext(FeatureToggleContext);

  const router = useRouter();

  const popLocker = useMemo(
    () => [ethereumPopLocker, polygonPopLocker, localhostPopLocker].filter(staking => selectedNetworks.includes(staking?.contract?.provider?._network?.chainId)), [selectedNetworks, ethereumPopLocker, polygonPopLocker, localhostPopLocker])
  const stakingPools = useMemo(
    () => ethereumStakingPools?.concat(polygonStakingPools, localhostStakingPools).filter(staking => selectedNetworks.includes(staking?.contract?.provider?._network?.chainId)),
    [selectedNetworks, ethereumStakingPools, polygonStakingPools, localhostStakingPools])


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
