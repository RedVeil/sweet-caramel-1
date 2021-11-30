import { numberToBigNumber } from '@popcorn/utils/src';
import { BigNumber } from 'ethers';
import { DateTime } from 'luxon';
import React, { useState } from 'react';
import { BatchType } from '../../../../interfaces/popcorn/BatchHYSI';
import { BatchProcessingCountdown } from '../BatchProcessingCountdown/index';
import { DespositWithdrawInterface } from '../DespositWithdrawInterface';

export const RightColumn = () => {
  const [withdrawal, setwithdrawal] = useState<boolean>(false);
  return (
    <div className="w-full col-span-1 px-6 lg:pr-12">
      <DespositWithdrawInterface
        deposit={function (
          depositAmount: BigNumber,
          batchType: BatchType,
        ): Promise<void> {
          throw new Error('Function not implemented.');
        }}
        depositDisabled={false}
        threeCrvBalance={numberToBigNumber(Math.pow(10, 18))}
        threeCrvPrice={numberToBigNumber(Math.pow(10, 18))}
        hysiBalance={numberToBigNumber(Math.pow(10, 18))}
        hysiPrice={numberToBigNumber(Math.pow(10, 18))}
        withdrawal={withdrawal}
        setwithdrawal={setwithdrawal}
        depositAmount={numberToBigNumber(Math.pow(10, 18))}
        setDepositAmount={function (value: BigNumber): void {
          throw new Error('Function not implemented.');
        }}
        useUnclaimedDeposits={false}
        setUseUnclaimedDeposits={function (value: Boolean): void {
          throw new Error('Function not implemented.');
        }}
      />
      <BatchProcessingCountdown
        timeTillBatchProcessing={[
          {
            timeTillProcessing: DateTime.now().plus({ hours: 12 }).toJSDate(),
            progressPercentage: 38.42,
          },
        ]}
      />
    </div>
  );
};
