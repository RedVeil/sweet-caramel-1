import {
  CashIcon,
  HandIcon,
  KeyIcon,
  SparklesIcon,
} from '@heroicons/react/outline';
import { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { StatCardAndTooltip } from '../StatCardAndTooltip';
import { StatCardRow } from './index';

export default {
  title: 'App / Batch HYSI / Components / Stat Card Row',
  component: StatCardRow,
  decorators: [
    (Story) => (
      <div className="flex flex-row justify-center mt-10">
        <Story></Story>
      </div>
    ),
  ],
} as Meta;

const TemplateFourCards: Story = (args) => (
  <StatCardRow {...args}>
    <StatCardAndTooltip
      data={{
        change: '10%',
        changeType: 'increase',
        icon: CashIcon,
        id: 1,
        name: 'Total Balance',
        statCur: 71897,
        statPrev: 35000,
      }}
      iconCol={'#4185f2'}
      showChange={false}
      tooltipTitle={'Total Balance'}
      tooltipContent={
        'Total acquisition of deposits, HYSI and pending withdrawls'
      }
    />
    <StatCardAndTooltip
      data={{
        change: '10%',
        changeType: 'increase',
        icon: SparklesIcon,
        id: 2,
        name: 'HYSI',
        statCur: 1897,
        statPrev: 35000,
      }}
      iconCol={'#646aec'}
      showChange={true}
      tooltipTitle={'HYSI'}
      tooltipContent={'HYSI desc'}
    />
    <StatCardAndTooltip
      data={{
        change: '10%',
        changeType: 'increase',
        icon: KeyIcon,
        id: 3,
        name: 'Claimable HYSI',
        statCur: 58897,
        statPrev: 35000,
      }}
      iconCol={'#f6732b'}
      showChange={false}
      tooltipTitle={'Claimable HYSI'}
      tooltipContent={'Claimable HYSI desc'}
    />
    <StatCardAndTooltip
      data={{
        change: '10%',
        changeType: 'increase',
        icon: HandIcon,
        id: 4,
        name: 'Pending Withdraw',
        statCur: 250,
        statPrev: 35000,
      }}
      iconCol={'#f39c2b'}
      showChange={false}
      tooltipTitle={'Pending Withdrawls'}
      tooltipContent={'Pending withdrawl desc'}
    />
  </StatCardRow>
);

const TemplateThreeCards: Story = (args) => (
  <StatCardRow {...args}>
    <StatCardAndTooltip
      data={{
        change: '10%',
        changeType: 'increase',
        icon: CashIcon,
        id: 1,
        name: 'Total Balance',
        statCur: 71897,
        statPrev: 35000,
      }}
      iconCol={'#4185f2'}
      showChange={false}
      tooltipTitle={'Total Balance'}
      tooltipContent={
        'Total acquisition of deposits, HYSI and pending withdrawls'
      }
    />
    <StatCardAndTooltip
      data={{
        change: '10%',
        changeType: 'increase',
        icon: SparklesIcon,
        id: 2,
        name: 'HYSI',
        statCur: 1897,
        statPrev: 35000,
      }}
      iconCol={'#646aec'}
      showChange={true}
      tooltipTitle={'HYSI'}
      tooltipContent={'HYSI desc'}
    />
    <StatCardAndTooltip
      data={{
        change: '10%',
        changeType: 'increase',
        icon: KeyIcon,
        id: 3,
        name: 'Claimable HYSI',
        statCur: 58897,
        statPrev: 35000,
      }}
      iconCol={'#f6732b'}
      showChange={false}
      tooltipTitle={'Claimable HYSI'}
      tooltipContent={'Claimable HYSI desc'}
    />
  </StatCardRow>
);

export const FourCards = TemplateFourCards.bind({});
export const ThreeCards = TemplateThreeCards.bind({});

FourCards.args = {};
ThreeCards.args = {};
