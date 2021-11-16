import { LockClosedIcon } from '@heroicons/react/outline';
import { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { ClaimCard } from './ClaimCard';

export default {
  title: 'App / Claims / Components / Claim Card',
  component: ClaimCard,
  decorators: [
    (Story) => (
      <div className="">
        <Story></Story>
      </div>
    ),
  ],
} as Meta;

const Template: Story = (args) => (
  <ClaimCard
    Icon={undefined}
    type={'Staking'}
    token={''}
    iconCol={''}
    amount={0}
    disabled={false}
    percent={0}
    {...args}
  />
);

export const Primary = Template.bind({});
export const Disabled = Template.bind({});
Primary.args = {
  disabled: false,
  percent: 200,
  amount: 1000,
  iconCol: 'bg-pink-500',
  type: 'Staking',
  Icon: LockClosedIcon,
  token: 'POP',
};

Disabled.args = {
  disabled: true,
  percent: 200,
  amount: 1000,
  iconCol: 'bg-pink-500',
  type: 'Staking',
  Icon: LockClosedIcon,
  token: 'POP',
};
