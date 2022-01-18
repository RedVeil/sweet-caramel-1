import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import Navbar from 'components/NavBar/NavBar';
import StakeCard from 'components/StakeCard';
import { Contracts, ContractsContext } from 'context/Web3/contracts';
import React, { useContext, useEffect, useState } from 'react';
import ContentLoader from 'react-content-loader';
import { Toaster } from 'react-hot-toast';
import {
  getSingleStakingPoolInfo,
  getStakingPoolsInfo,
  StakingPoolInfo,
} from '../../../utils';

async function getStakingPools(
  contracts: Contracts,
  library,
): Promise<StakingPoolInfo[]> {
  const stakingPools = await getStakingPoolsInfo(contracts, library);
  if (contracts.popStaking) {
    const popStakingPool = await getSingleStakingPoolInfo(
      contracts.popStaking,
      library,
      contracts.pop.address,
      'Popcorn',
    );
    return [popStakingPool, ...stakingPools];
  }
  return stakingPools;
}

export default function index(): JSX.Element {
  const context = useWeb3React<Web3Provider>();
  const { contracts } = useContext(ContractsContext);
  const { library, chainId } = context;
  const [stakingPoolsInfo, setStakingPools] = useState<StakingPoolInfo[]>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!library || !contracts || !chainId) {
      return;
    }
    getStakingPools(contracts, library)
      .then((res) => {
        setStakingPools(res);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [contracts]);

  useEffect(() => {
    if (stakingPoolsInfo?.length) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [stakingPoolsInfo]);

  useEffect(() => {
    return () => {
      setStakingPools(undefined);
    };
  }, []);

  return (
    <div className="w-full h-screen">
      <Navbar />
      <Toaster position="top-right" />
      <div className="">
        <div className="lg:w-11/12 lglaptop:w-9/12 2xl:max-w-7xl mx-auto mt-14">
          <div className="w-1/3">
            <div className="">
              <h1 className="text-3xl font-bold">Staking</h1>
              <p className="text-lg text-gray-500 mt-2">
                Earn more by staking your tokens
              </p>
            </div>
          </div>
          <div className="flex flex-row mt-10">
            <div className="w-1/3">
              <div className="bg-primaryLight rounded-5xl p-10 pt-44 pb-44 mr-12 mb-24 shadow-custom">
                <img
                  src="/images/farmerCat.svg"
                  alt="farmerCat"
                  className="mx-auto transform scale-101 py-2"
                />
              </div>
            </div>
            <div className="w-2/3">
              <div className="space-y-6">
                {loading && (
                  <ContentLoader
                    viewBox="0 0 450 400"
                    backgroundColor="#f0f0f0"
                    foregroundColor="#dedede"
                  >
                    <rect
                      x="0"
                      y="0"
                      rx="15"
                      ry="15"
                      width="450"
                      height="108"
                    />
                    <rect
                      x="0"
                      y="115"
                      rx="15"
                      ry="15"
                      width="450"
                      height="108"
                    />
                    <rect
                      x="0"
                      y="230"
                      rx="15"
                      ry="15"
                      width="450"
                      height="108"
                    />
                  </ContentLoader>
                )}
                {contracts?.staking &&
                  stakingPoolsInfo &&
                  stakingPoolsInfo.length > 0 &&
                  stakingPoolsInfo.map((poolInfo, index) => (
                    <div key={poolInfo.stakedTokenName}>
                      <StakeCard
                        tokenName={poolInfo?.stakedTokenName}
                        stakingPoolInfo={poolInfo}
                        url={poolInfo.stakingContractAddress}
                        stakingContract={
                          contracts?.staking[index]
                            ? contracts?.staking[index]
                            : undefined
                        }
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
