import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import Navbar from 'components/NavBar/NavBar';
import StakeCard from 'components/StakeCard';
import { Contracts, ContractsContext } from 'context/Web3/contracts';
import React, { useContext, useEffect, useState } from 'react';
import ContentLoader from 'react-content-loader';
import { Toaster } from 'react-hot-toast';
import { getStakingPoolsInfo, StakingPoolInfo } from '../../../utils';

async function getStakingPools(contracts: Contracts, library): Promise<StakingPoolInfo[]> {
  return getStakingPoolsInfo(contracts, library);
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
              {loading && (
                <ContentLoader viewBox="0 0 450 400">
                  {/*eslint-disable */}
                  <rect x="0" y="0" rx="15" ry="15" width="450" height="108" />
                  <rect x="0" y="115" rx="15" ry="15" width="450" height="108" />
                  <rect x="0" y="230" rx="15" ry="15" width="450" height="108" />
                  {/*eslint-enable */}
                </ContentLoader>
              )}
              {contracts?.staking &&
                stakingPoolsInfo &&
                stakingPoolsInfo.length > 0 &&
                stakingPoolsInfo.map((poolInfo, index) => (
                  <StakeCard
                    key={poolInfo.stakedTokenName}
                    tokenName={poolInfo?.stakedTokenName}
                    stakingPoolInfo={poolInfo}
                    url={poolInfo.stakingContractAddress}
                    stakingContract={contracts?.staking[index] ? contracts?.staking[index] : undefined}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
