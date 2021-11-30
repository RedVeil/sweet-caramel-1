import { BatchType } from '@popcorn/ui/src/interfaces/popcorn/BatchHYSI';
import { numberToBigNumber } from '@popcorn/utils/';
import { Meta, Story } from '@storybook/react/types-6-0';
import { BigNumber } from 'ethers';
import React from 'react';
import { DespositWithdrawInterface } from './index';

export default {
  title: 'App / Batch HYSI / Components / Mint Redeem Interface',
  component: DespositWithdrawInterface,
  decorators: [
    (Story) => (
      <div className="w-1/2">
        <Story></Story>
      </div>
    ),
  ],
} as Meta;

const Template: Story = (args) => (
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
    withdrawal={undefined}
    setwithdrawal={function (value: Boolean): void {
      throw new Error('Function not implemented.');
    }}
    depositAmount={numberToBigNumber(Math.pow(10, 18))}
    setDepositAmount={function (value: BigNumber): void {
      throw new Error('Function not implemented.');
    }}
    useUnclaimedDeposits={undefined}
    setUseUnclaimedDeposits={function (value: Boolean): void {
      throw new Error('Function not implemented.');
    }}
    {...args}
  />
);

export const Withdrawal = Template.bind({});
export const Deposit = Template.bind({});
export const InvalidInput = Template.bind({});

Withdrawal.args = {
  deposit: function (
    depositAmount: BigNumber,
    batchType: BatchType,
  ): Promise<void> {
    throw new Error('Function not implemented.');
  },
  depositDisabled: false,
  threeCrvBalance: numberToBigNumber(Math.pow(10, 18)),
  threeCrvPrice: numberToBigNumber(Math.pow(10, 18)),
  hysiBalance: numberToBigNumber(Math.pow(10, 18)),
  hysiPrice: numberToBigNumber(Math.pow(10, 18)),
  withdrawal: true,
  setwithdrawal: function (value: Boolean): void {
    throw new Error('Function not implemented.');
  },
  depositAmount: numberToBigNumber(Math.pow(10, 18)),
  setDepositAmount: function (value: BigNumber): void {
    throw new Error('Function not implemented.');
  },
  useUnclaimedDeposits: false,
  setUseUnclaimedDeposits: function (value: Boolean): void {
    throw new Error('Function not implemented.');
  },
};

Deposit.args = {
  deposit: function (
    depositAmount: BigNumber,
    batchType: BatchType,
  ): Promise<void> {
    throw new Error('Function not implemented.');
  },
  depositDisabled: false,
  threeCrvBalance: numberToBigNumber(Math.pow(10, 18)),
  threeCrvPrice: numberToBigNumber(Math.pow(10, 18)),
  hysiBalance: numberToBigNumber(Math.pow(10, 18)),
  hysiPrice: numberToBigNumber(Math.pow(10, 18)),
  withdrawal: false,
  setwithdrawal: function (value: Boolean): void {
    throw new Error('Function not implemented.');
  },
  depositAmount: numberToBigNumber(Math.pow(10, 18)),
  setDepositAmount: function (value: BigNumber): void {
    throw new Error('Function not implemented.');
  },
  useUnclaimedDeposits: false,
  setUseUnclaimedDeposits: function (value: Boolean): void {
    throw new Error('Function not implemented.');
  },
};

InvalidInput.args = {
  deposit: function (
    depositAmount: BigNumber,
    batchType: BatchType,
  ): Promise<void> {
    throw new Error('Function not implemented.');
  },
  depositDisabled: false,
  threeCrvBalance: numberToBigNumber(Math.pow(10, 18)),
  threeCrvPrice: numberToBigNumber(Math.pow(10, 18)),
  hysiBalance: numberToBigNumber(Math.pow(10, 18)),
  hysiPrice: numberToBigNumber(Math.pow(10, 18)),
  withdrawal: false,
  setwithdrawal: function (value: Boolean): void {
    throw new Error('Function not implemented.');
  },
  depositAmount: numberToBigNumber(Math.pow(12, 18)),
  setDepositAmount: function (value: BigNumber): void {
    throw new Error('Function not implemented.');
  },
  useUnclaimedDeposits: false,
  setUseUnclaimedDeposits: function (value: Boolean): void {
    throw new Error('Function not implemented.');
  },
};
