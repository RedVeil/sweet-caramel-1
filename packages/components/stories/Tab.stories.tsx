import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import TabSwitcher, { TabPanel } from "../components/Tabs";

export default {
  title: "Example/Tab",
  component: TabSwitcher,
  argTypes: {
    backgroundColor: { control: "color" },
  },
} as ComponentMeta<typeof TabSwitcher>;

const Template: ComponentStory<typeof TabSwitcher> = (args) => <TabSwitcher {...args} />;
const TabPanelTemplate: ComponentStory<typeof TabPanel> = (args) => <TabPanel {...args} />;
export const Primary = Template.bind({});

Primary.args = {
  tabs: [{ label: "All" }, { label: "Products" }, { label: "Rewards" }, { label: "Assets" }],
  defaultActiveTab: "All",
  children: (
    <div className="mt-5">
      <TabPanelTemplate whenActive="All">Tab 1 Content</TabPanelTemplate>
      <TabPanelTemplate whenActive="Products">Tab 2 Content</TabPanelTemplate>
      <TabPanelTemplate whenActive="Rewards">Tab 3 Content</TabPanelTemplate>
      <TabPanelTemplate whenActive="Assets">Tab 4 Content</TabPanelTemplate>
    </div>
  ),
};
