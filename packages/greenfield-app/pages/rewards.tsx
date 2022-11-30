import ConnectDepositCard from "@popcorn/app/components/Common/ConnectDepositCard";
import SecondaryActionButton from "@popcorn/app/components/SecondaryActionButton";
import TabSelector from "components/TabSelector";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import { useEffect, useState } from "react";
import useSelectNetwork from "hooks/useNetworkFilter";
import { useChainsWithStakingRewards } from "hooks/staking/useChainsWithStaking";
import NetworkFilter from "components/NetworkFilter";
import { ChainId } from "@popcorn/utils";
import AirDropClaim from "components/rewards/AirdropClaim";
import StakingRewardsContainer from "components/rewards/StakingRewardsContainer";
import VestingContainer from "components/vesting/VestingContainer";
import { useComponentState } from "@popcorn/components/hooks";

export enum Tabs {
  Staking = "Staking Rewards",
  Airdrop = "Airdrop Redemption",
  Vesting = "Vesting Records",
}

export default function RewardsPage(): JSX.Element {
  const { account, connect } = useWeb3();
  const supportedNetworks = useChainsWithStakingRewards();
  const [selectedNetworks, selectNetwork] = useSelectNetwork(supportedNetworks);
  const [tabSelected, setTabSelected] = useState<Tabs>(Tabs.Staking);
  const [availableTabs, setAvailableTabs] = useState<Tabs[]>([]);
  const isSelected = (tab: Tabs) => tabSelected === tab;
  const { ready, loading } = useComponentState({ ready: account, loading: !account });

  useEffect(() => {
    if (shouldAirdropVisible(selectedNetworks)) {
      setAvailableTabs([Tabs.Staking, Tabs.Airdrop, Tabs.Vesting]);
    } else {
      setAvailableTabs([Tabs.Staking, Tabs.Vesting]);
    }
  }, [selectedNetworks]);

  const shouldAirdropVisible = (chainId) => {
    if (chainId.length === 1) {
      return [ChainId.Arbitrum, ChainId.Polygon, ChainId.Hardhat, ChainId.BNB, ChainId.Localhost].includes(chainId[0]);
    }
    return false;
  };

  return (
    <>
      <div className="grid grid-cols-12 md:gap-8 laptop:gap-14">
        <div className="col-span-12 md:col-span-3">
          <h1 className="text-6xl leading-12 text-black">Rewards</h1>
          <p className="mt-4 leading-5 text-black">Claim your rewards and track your vesting records.</p>
          {!ready && (
            <div
              className=" rounded-lg md:border md:border-customLightGray px-0 pt-4 md:p-6 md:pb-0 mt-6"
              onClick={connect}
              role="button"
            >
              <p className="text-gray-900 text-3xl leading-8 hidden md:block">Connect your wallet</p>
              <div className="border md:border-0 md:border-t border-customLightGray rounded-lg md:rounded-none px-6 md:px-0 py-6 md:py-2 mb-1 md:mt-4">
                <div className="hidden md:block">
                  <SecondaryActionButton label="Connect" />
                </div>
                <div className="md:hidden">
                  <SecondaryActionButton label="Connect Wallet" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="col-span-12 md:col-span-6 md:col-end-13 gap-6 hidden md:grid grid-cols-6">
          <div className="rounded-lg bg-rewardsGreen col-span-1 h-88"></div>

          <div className="col-span-5 rounded-lg bg-rewardsLightGreen flex justify-end items-end p-8">
            <img src="/images/twoFingers.svg" alt="twoFingers" className="h-48 w-48" />
          </div>
        </div>
      </div>

      {ready && (
        <div className="grid grid-cols-12 md:gap-8 mt-16 md:mt-20">
          <div className="col-span-12 md:col-span-4">
            <div className={`mb-12`}>
              <NetworkFilter
                supportedNetworks={supportedNetworks}
                selectedNetworks={selectedNetworks}
                selectNetwork={selectNetwork}
              />
            </div>
            <ConnectDepositCard extraClasses="md:h-104" />
          </div>
          <div className="flex flex-col col-span-12 md:col-span-8 md:mb-8 mt-10 md:mt-0">
            <TabSelector activeTab={tabSelected} setActiveTab={setTabSelected} availableTabs={availableTabs} />
            <div className={`${isSelected(Tabs.Staking) ? "" : "hidden"}`}>
              <StakingRewardsContainer selectedNetworks={selectedNetworks} />
            </div>

            <div className={`mt-8 ${isSelected(Tabs.Airdrop) ? "" : "hidden"}`}>
              <AirDropClaim chainId={selectedNetworks[0]} />
            </div>

            <div className={`flex flex-col h-full mt-4 ${isSelected(Tabs.Vesting) ? "" : "hidden"}`}>
              <VestingContainer selectedNetworks={selectedNetworks} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
