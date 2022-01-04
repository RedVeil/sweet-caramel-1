import { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import { LoadingCatComponent } from './index';

export default {
  title: 'LoadingCat',
  component: LoadingCatComponent,
  decorators: [
    (Story) => (
      <div className="flex flex-row justify-center ">
        <Story></Story>
      </div>
    ),
  ],
} as Meta;

const Template: Story = (args) => <LoadingCatComponent {...args} />;
export const Primary = Template.bind({});
Primary.args = {};
