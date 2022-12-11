import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import { Badge } from "../components/Badge";

export default {
  title: "Example/Badge",
  component: Badge,
  argTypes: {
    backgroundColor: { control: "color" },
  },
} as ComponentMeta<typeof Badge>;

const Template: ComponentStory<typeof Badge> = (args) => <Badge {...args} />;

export const Warning = Template.bind({});
Warning.args = {
  variant: "warning",
  children: "Warning",
};

export const Success = Template.bind({});
Success.args = {
  variant: "success",
  children: "Success",
};

export const White = Template.bind({});
White.args = {
  variant: "white",
  children: "White",
};
