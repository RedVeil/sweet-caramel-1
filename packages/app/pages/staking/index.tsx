import { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import Navbar from 'components/NavBar/NavBar';
import StakeCard from 'components/StakeCard';
import { ContractsContext } from 'context/Web3/contracts';
import { useContext, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { getStakingPoolsInfo, StakingPoolInfo } from '../../../utils';

interface TokenBalances {
  pop: number;
  popEthLp: number;
  butter: number;
}

export default function index(): JSX.Element {
  const context = useWeb3React<Web3Provider>();
  const { contracts } = useContext(ContractsContext);
  const { library, chainId } = context;
  const [stakingPoolsInfo, setStakingPools] = useState<StakingPoolInfo[]>();

  useEffect(() => {
    if (!library || !contracts || !chainId) {
      return;
    }
    getStakingPoolsInfo(contracts, library)
      .then((res) => {
        setStakingPools(res);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [contracts]);

  return (
    <div className="w-full h-screen">
      <Navbar />
      <Toaster position="top-right" />
      <div className="">
        <div className="w-9/12 mx-auto flex flex-row mt-14">
          <div className="w-1/3">
            <div className="">
              <h1 className="text-3xl  font-medium">Staking</h1>
              <p className="text-lg text-gray-500 mt-2">
                Earn more income staking your crypto with us
              </p>
            </div>
            <div className="bg-primaryLight rounded-5xl pt-44 pb-44 mr-12 mt-10 shadow-custom">
              <img
                src="/images/farmerCat.svg"
                alt="farmcerCat"
                className="mx-auto transform scale-101 py-2"
              />
            </div>
          </div>

          <div className="w-2/3 mt-28">
            <div className="space-y-6">
              {stakingPoolsInfo &&
                stakingPoolsInfo.length > 0 &&
                stakingPoolsInfo.map((poolInfo, index) => (
                  <div
                    key={poolInfo.stakedTokenName + poolInfo.stakedTokenAddress}
                  >
                    <StakeCard
                      stakedTokenAddress={poolInfo?.stakedTokenAddress}
                      tokenName={poolInfo?.stakedTokenName}
                      stakingPoolInfo={poolInfo}
                      url={poolInfo.stakingContractAddress}
                      stakingContract={
                        contracts.staking[index]
                          ? contracts.staking[index]
                          : undefined
                      }
                      index={index}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
