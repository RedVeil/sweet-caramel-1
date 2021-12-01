import { Meta, Story } from '@storybook/react/types-6-0';
import { BigNumber } from 'ethers';
import React from 'react';
import { DepositRequestRow } from './index';

export default {
  title: 'App / Batch HYSI / Components / Deposit Request Row',
  component: DepositRequestRow,
  decorators: [
    (Story) => (
      <div className="flex flex-row justify-center">
        <Story></Story>
      </div>
    ),
  ],
} as Meta;

const Template: Story = (args) => (
  <DepositRequestRow
    depositRequest={undefined}
    claim={function (batchId: string): Promise<void> {
      throw new Error('Function not implemented.');
    }}
    withdraw={function (batchId: string, amount: BigNumber): Promise<void> {
      throw new Error('Function not implemented.');
    }}
    {...args}
  />
);

export const OddIndexClaim = Template.bind({});
export const EvenIndexWithdraw = Template.bind({});

OddIndexClaim.args = {
  depositRequest: {
    batchNumber: 1,
    batchId: '001',
    depositAmount: 100,
    despositCurrency: 'USDC',
    HYSITokenToReceive: 100,
    submittedRequestDatetime: new Date(),
    claimable: true,
    amount: Math.pow(10, 18),
    index: 1,
  },
  claim: async (batchId: string) => {},
  withdraw: async (batchId: string, amount: BigNumber) => {},
};

EvenIndexWithdraw.args = {
  depositRequest: {
    batchNumber: 1,
    batchId: '001',
    depositAmount: 100,
    despositCurrency: 'USDC',
    HYSITokenToReceive: 100,
    submittedRequestDatetime: new Date(),
    claimable: false,
    amount: Math.pow(10, 18),
    index: 2,
  },
  claim: async (batchId: string) => {},
  withdraw: async (batchId: string, amount: BigNumber) => {},
};
