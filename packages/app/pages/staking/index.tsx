import { Address } from "@popcorn/utils/types";
import Navbar from "components/NavBar/NavBar";
import StakeCard from "components/StakeCard";
import usePopLocker from "hooks/staking/usePopLocker";
import useStakingPools from "hooks/staking/useStakingPools";
import useWeb3 from "hooks/useWeb3";
import { useRouter } from "next/router";
import React from "react";
import ContentLoader from "react-content-loader";
import { Toaster } from "react-hot-toast";

export default function index(): JSX.Element {
  const { contractAddresses } = useWeb3();
  const router = useRouter();

  const { data: popLocker } = usePopLocker(contractAddresses.popStaking);
  const { data: stakingPools } = useStakingPools(contractAddresses.staking);

  const onSelectPool = (stakingContractAddress: Address, stakingTokenAddress: Address) => {
    if (stakingTokenAddress?.toLowerCase() === contractAddresses.pop.toLowerCase()) {
      router.push("staking/pop");
    } else {
      router.push(`staking/${stakingContractAddress}`);
    }
  };

  return (
    <div className="w-full h-screen">
      <Navbar />
      <Toaster position="top-right" />
      <div className="lg:w-11/12 lglaptop:w-9/12 2xl:max-w-7xl mx-auto mt-14 pb-6">
        <div className="text-center md:text-left md:w-1/3">
          <h1 className="page-title">Staking</h1>
          <p className="md:text-lg text-gray-500 mt-2">Earn more by staking your tokens</p>
        </div>
        <div className="flex flex-row mt-10">
          <div className="hidden md:block w-1/3">
            <div className="bg-primaryLight rounded-5xl p-10 pt-44 pb-44 mr-12 mb-24 shadow-custom">
              <img src="/images/farmerCat.svg" alt="farmerCat" className="mx-auto transform scale-101 py-2" />
            </div>
          </div>
          <div className="md:w-2/3 mx-auto">
            <div className="space-y-6 mx-4">
              {!popLocker || !stakingPools ? (
                <ContentLoader viewBox="0 0 450 400">
                  {/*eslint-disable */}
                  <rect x="0" y="0" rx="15" ry="15" width="450" height="108" />
                  <rect x="0" y="115" rx="15" ry="15" width="450" height="108" />
                  <rect x="0" y="230" rx="15" ry="15" width="450" height="108" />
                  {/*eslint-enable */}
                </ContentLoader>
              ) : (
                <>
                  <StakeCard
                    key={popLocker.address}
                    stakingPool={popLocker}
                    stakedToken={popLocker.stakingToken}
                    onSelectPool={onSelectPool}
                  />
                  {stakingPools.map((stakingPool) => (
                    <div key={stakingPool.address}>
                      <StakeCard
                        stakingPool={stakingPool}
                        stakedToken={stakingPool.stakingToken}
                        onSelectPool={onSelectPool}
                      />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
