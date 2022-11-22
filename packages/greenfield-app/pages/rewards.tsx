import ConnectDepositCard from "@popcorn/app/components/Common/ConnectDepositCard";
import SecondaryActionButton from "@popcorn/app/components/SecondaryActionButton";
import TabSelector from "components/TabSelector";
import useWeb3 from "@popcorn/app/hooks/useWeb3";
import { useEffect, useRef, useState } from "react";
import useAllStakingContracts from "hooks/staking/useAllStakingContracts";
import Vesting from "components/vesting/Vesting";
import useSelectNetwork from "hooks/useNetworkFilter";
import { useChainsWithStakingRewards } from "hooks/staking/useChainsWithStaking";
import NetworkFilter from "components/NetworkFilter";
import ClaimCard from "components/rewards/ClaimCard";
import { NotAvailable } from "@popcorn/app/components/Rewards/NotAvailable";

export enum Tabs {
  Staking = "Staking Rewards",
  Vesting = "Vesting Records",
}

export default function RewardsPage(): JSX.Element {
  const { account, connect } = useWeb3();
  const stakingContracts = useAllStakingContracts();
  const supportedNetworks = useChainsWithStakingRewards();
  const [selectedNetworks, selectNetwork] = useSelectNetwork(supportedNetworks);
  const [tabSelected, setTabSelected] = useState<Tabs>(Tabs.Staking);
  const isSelected = (tab: Tabs) => tabSelected === tab;
  const [hasVesting, setHasVesting] = useState<boolean>(false);
  const [hasStaking, setHasStaking] = useState<boolean>(false);
  const rewardDiv = useRef<HTMLDivElement>();
  const stakingDiv = useRef<HTMLDivElement>();

  useEffect(() => {
    // Check if a Vesting Record and Staking Records shows up
    const rewardsCheck = setInterval(() => {
      rewardDiv?.current?.childNodes?.forEach((node) => {
        // @ts-expect-error
        if (node.classList.value === "flex flex-col h-full ") {
          setHasVesting(true);
          clearInterval(rewardsCheck);
        }
      });
      stakingDiv?.current?.childNodes?.forEach((node) => {
        // @ts-expect-error
        if (node.classList.value === "show-staking") {
          setHasStaking(true);
          clearInterval(rewardsCheck);
        }
      });
    }, 1000);
    // If there is no vesting record after 10s dont check anymore
    setTimeout(() => {
      clearInterval(rewardsCheck);
    }, 10000);
  }, []);

  return (
    <>
      <div className="grid grid-cols-12 md:gap-8 laptop:gap-14">
        <div className="col-span-12 md:col-span-3">
          <h1 className="text-6xl leading-12 text-black">Rewards</h1>
          <p className="mt-4 leading-5 text-black">Claim your rewards and track your vesting records.</p>
          {!account && (
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

      {account && (
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
            <TabSelector
              activeTab={tabSelected}
              setActiveTab={setTabSelected}
              availableTabs={[Tabs.Staking, Tabs.Vesting]}
            />
            <div className={`${isSelected(Tabs.Staking) ? "" : "hidden"}`}>
              <div className={`mt-4 ${hasStaking ? "hidden" : ""}`}>
                <NotAvailable
                  title="No Records Available"
                  body="No vesting records available"
                  image="/images/emptyRecord.svg"
                />
              </div>
              {stakingContracts?.stakingPools &&
                stakingContracts?.stakingPools.length > 0 &&
                stakingContracts?.stakingPools?.map((staking) => (
                  <div ref={stakingDiv} key={staking?.chainId + staking?.address}>
                    <ClaimCard
                      chainId={staking?.chainId}
                      stakingAddress={staking?.address}
                      stakingType={staking?.stakingType}
                    />
                  </div>
                ))
              }
            </div >

            <div className={`flex flex-col h-full mt-4 ${isSelected(Tabs.Vesting) ? "" : "hidden"}`} ref={rewardDiv}>
              <div className={`mb-4 ${hasVesting ? "hidden" : ""}`}>
                <NotAvailable
                  title="No Records Available"
                  body="No vesting records available"
                  image="/images/emptyRecord.svg"
                />
              </div>
              {supportedNetworks
                .filter((chain) => selectedNetworks.includes(chain))
                .map((chain) => (
                  <Vesting key={chain + "Vesting"} chainId={chain} />
                ))}
            </div>
          </div >
        </div >
      )
      }
    </>
  );
}
