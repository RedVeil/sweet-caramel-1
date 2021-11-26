import StakeCard from 'components/StakeCard';
import { ContractsContext } from 'context/Web3/contracts';
import React from 'react';
import { StakingPoolInfo } from '../../../utils';

export type StakingCardsListProps = {
  stakingPoolsInfo: StakingPoolInfo[];
};

export default function StakingCardsList({
  stakingPoolsInfo,
}: StakingCardsListProps): JSX.Element {
  const { contracts } = React.useContext(ContractsContext);
  return (
    <>
      {contracts && stakingPoolsInfo && stakingPoolsInfo.length > 0 && contracts.staking && contracts.staking.length > 0 ? (
        stakingPoolsInfo.map((poolInfo, index) => (
          <div key={poolInfo.stakedTokenName + poolInfo.stakedTokenAddress}>
            <StakeCard
              stakedTokenAddress={poolInfo.stakedTokenAddress}
              tokenName={poolInfo.stakedTokenName}
              stakingPoolInfo={poolInfo}
              url={poolInfo.stakedTokenName.toLowerCase().replace(' ', '-')}
              stakingContract={
                contracts.staking[index] ? contracts.staking[index] : undefined
              }
              index={index}
            />
          </div>
        ))
      ) : (
        <></>
      )}
    </>
  );
}
