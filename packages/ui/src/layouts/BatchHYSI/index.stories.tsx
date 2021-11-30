import {
  CashIcon,
  HandIcon,
  KeyIcon,
  SparklesIcon,
} from '@heroicons/react/outline';
import { Meta, Story } from '@storybook/react/types-6-0';
import { BigNumber } from 'ethers';
import React from 'react';
import { DepositRequestTable } from '../../components/popcorn/BatchHYSI/DepositRequestTable';
import { ErrorBadge } from '../../components/popcorn/BatchHYSI/ErrorBadge';
import { Header } from '../../components/popcorn/BatchHYSI/Header';
import { LeftColumn } from '../../components/popcorn/BatchHYSI/LeftColumn';
import { RightColumn } from '../../components/popcorn/BatchHYSI/RightColumn';
import { SuccessBadge } from '../../components/popcorn/BatchHYSI/SuccessBadge';
import { DepositRequest } from '../../interfaces/popcorn/BatchHYSI';
import { getDummyData } from '../../utils/batchHYSI';

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

interface BatchHYSIProps {
  componentState: string;
}
const BatchHYSI: React.FC<BatchHYSIProps> = ({
  componentState,
}): JSX.Element => {
  return (
    <div className="bg-gray-100">
      <div className="bg-gray-900">
        <div className="absolute pl-6 pr-16 py-2 lg:pl-12 lg:pr-20 w-full ">
          {componentState === 'error' && <ErrorBadge />}
          {componentState === 'success' && <SuccessBadge />}
        </div>
      </div>
      <Header title={'Popcorn Yield Optimizer'} />
      <div className="grid grid-cols-1 lg:grid-cols-3">
        <LeftColumn
          totalBalance={{
            change: '10%',
            changeType: 'increase',
            icon: CashIcon,
            id: 1,
            name: 'Total Balance',
            statCur: 71897,
            statPrev: 35000,
          }}
          HYSI={{
            change: '10%',
            changeType: 'increase',
            icon: SparklesIcon,
            id: 2,
            name: 'HYSI',
            statCur: 1897,
            statPrev: 35000,
          }}
          ClaimableHYSI={{
            change: '10%',
            changeType: 'increase',
            icon: KeyIcon,
            id: 3,
            name: 'Claimable HYSI',
            statCur: 58897,
            statPrev: 35000,
          }}
          PendingWithdraw={{
            change: '10%',
            changeType: 'increase',
            icon: HandIcon,
            id: 4,
            name: 'Pending Withdraw',
            statCur: 250,
            statPrev: 35000,
          }}
          chartData={getDummyData('30D')}
        />
        <RightColumn />
      </div>

      <DepositRequestTable
        depositRequests={getDespositRequests(10)}
        claim={async (batchId: string) => {}}
        withdraw={async (batchId: string, amount: BigNumber) => {}}
      />
    </div>
  );
};

export default {
  title: 'App / Batch HYSI / Page / HYSI Deposit Withdraw',
  component: BatchHYSI,
  decorators: [
    (Story) => (
      <div>
        <Story />
      </div>
    ),
  ],
} as Meta;

const Template: Story = (args) => <BatchHYSI componentState={''} {...args} />;

export const Error = Template.bind({});
export const Primary = Template.bind({});
export const Success = Template.bind({});

Error.args = {
  componentState: 'error',
};

Primary.args = {
  componentState: '',
};

Success.args = {
  componentState: 'success',
};
