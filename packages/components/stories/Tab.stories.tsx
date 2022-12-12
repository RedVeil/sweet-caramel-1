import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import TabSwitcher, { TabPanel, Tab } from "../components/Tabs";

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

const tabs = [{ label: "All" }, { label: "Products" }, { label: "Rewards" }, { label: "Assets" }];

Primary.args = {
  defaultActiveTab: "All",
  tabs,
  children: (
    <>
      <div className="flex justify-between">
        <h1>hello world</h1>
        <div className="flex items-center space-x-4">
          {tabs.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </div>
      </div>
      <div className="mt-5">
        <TabPanelTemplate whenActive="All">Tab 1 Content</TabPanelTemplate>
        <TabPanelTemplate whenActive="Products">Tab 2 Content</TabPanelTemplate>
        <TabPanelTemplate whenActive="Rewards">Tab 3 Content</TabPanelTemplate>
        <TabPanelTemplate whenActive="Assets">Tab 4 Content</TabPanelTemplate>
      </div>
    </>
  ),
};
