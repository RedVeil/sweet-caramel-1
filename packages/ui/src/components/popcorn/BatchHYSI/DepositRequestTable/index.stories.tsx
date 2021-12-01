import { Meta, Story } from '@storybook/react/types-6-0';
import { BigNumber } from 'ethers';
import React from 'react';
import { DepositRequest } from '../../../../interfaces/popcorn/BatchHYSI';
import { DepositRequestTable } from './index';

export default {
  title: 'App / Batch HYSI / Components / Deposit Request Table',
  component: DepositRequestTable,
  decorators: [
    (Story) => (
      <div className="flex flex-row justify-center">
        <Story></Story>
      </div>
    ),
  ],
} as Meta;

const Template: Story = (args) => (
  <DepositRequestTable
    depositRequests={[]}
    claim={function (batchId: string): Promise<void> {
      throw new Error('Function not implemented.');
    }}
    withdraw={function (batchId: string, amount: BigNumber): Promise<void> {
      throw new Error('Function not implemented.');
    }}
    {...args}
  />
);

const getDespositRequests = (numBatches: number): DepositRequest[] => {
  return new Array(numBatches).fill(undefined).map((x, i) => {
    return {
      batchNumber: i + 1,
      batchId: `00${i}`,
      depositAmount: 100,
      despositCurrency: 'USDC',
      HYSITokenToReceive: 100,
      submittedRequestDatetime: new Date(),
      claimable: true,
      amount: Math.pow(10, 18),
      index: i,
    } as DepositRequest;
  });
};
export const Primary = Template.bind({});
Primary.args = {
  depositRequests: getDespositRequests(10),
  claim: async (batchId: string) => {},
  withdraw: async (batchId: string, amount: BigNumber) => {},
};
