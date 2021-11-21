import { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { StatCardAndTooltip } from '../../BatchHYSI/StatCardAndTooltip';
import { StatCards } from './StatCards';

export default {
  title: 'App / Claims / Components / Stat Cards',
  component: StatCards,
  decorators: [
    (Story) => (
      <div className="flex flex-row mt-20 justify-center">
        <Story></Story>
      </div>
    ),
  ],
} as Meta;

const Template: Story = (args) => (
  <StatCards {...args}>
    <StatCardAndTooltip
      data={{
        change: '10%',
        changeType: 'increase',
        id: 1,
        name: 'Earned',
        statCur: 71897,
        statPrev: 35000,
      }}
      iconCol={'#4185f2'}
      showChange={false}
      tooltipTitle={'Earned'}
      tooltipContent={'Earned desc'}
      minWidth={'18rem'}
      token={'POP'}
    />
    <StatCardAndTooltip
      data={{
        change: '10%',
        changeType: 'increase',
        id: 2,
        name: 'Claimable',
        statCur: 1897,
        statPrev: 35000,
      }}
      iconCol={'#646aec'}
      showChange={false}
      tooltipTitle={'Claimable'}
      tooltipContent={'Claimable desc'}
      minWidth={'18rem'}
      token={'POP'}
    />
  </StatCards>
);

export const Primary = Template.bind({});

Primary.args = {};
