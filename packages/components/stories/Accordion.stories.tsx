import { ComponentStory, ComponentMeta } from "@storybook/react";
import { Accordion, AccordionVariant } from "../components/Accordion";
import ETHIcon from "./assets/ethereum.svg";

export default {
  title: "Components/Accordion",
  component: Accordion,
  argTypes: {
    backgroundColor: { control: "color" },
  },
} as ComponentMeta<typeof Accordion>;

const Template: ComponentStory<typeof Accordion> = (args) => <Accordion {...args} />;

export const primary = Template.bind({});

primary.args = {
  variant: AccordionVariant.Default,
  children: (
    <>
      <Accordion.Item value="1" toggleText={<h1>Item 1</h1>}>
        <p>Item 1 content</p>
      </Accordion.Item>
      <Accordion.Item value="2" toggleText={<h1>Item 2</h1>}>
        <p>Item 2 content</p>
      </Accordion.Item>
      <Accordion.Item value="3" toggleText={<h1>Item 3</h1>}>
        <p>Item 3 content</p>
      </Accordion.Item>
    </>
  ),
};

export const SweetVaults = Template.bind({});

const ToggleText = () => (
  <div className="flex items-center">
    <Accordion.Icon size={32} icon={ETHIcon} />
    <h2 className="text-2xl font-medium ml-3">USDT</h2>
  </div>
);

const Title = () => (
  <ul className="grid grid-cols-4 gap-4 mt-6 text-left">
    <li className="flex flex-col">
      <p className="text-primaryLight mb-2">Your Wallet</p>
      <p className="text-primary">
        $120K <span className="text-primaryLight">USDT</span>
      </p>
    </li>
    <li className="flex flex-col">
      <p className="text-primaryLight mb-2">Your Deposit</p>
      <p className="text-primary">
        $120K <span className="text-primaryLight">USDT</span>
      </p>
    </li>
    <li className="flex flex-col">
      <p className="text-primaryLight mb-2">vAPR</p>
      <p className="text-primary">
        $120K <span className="text-primaryLight">USDT</span>
      </p>
    </li>
    <li className="flex flex-col">
      <p className="text-primaryLight mb-2">TVL</p>
      <p className="text-primary">
        $120K <span className="text-primaryLight">USDT</span>
      </p>
    </li>
  </ul>
);

SweetVaults.args = {
  variant: AccordionVariant.Default,
  children: (
    <>
      <Accordion.Item value="1" toggleText={<ToggleText />} title={<Title />}>
        <p>Item 1 content</p>
      </Accordion.Item>
      <Accordion.Item value="2" toggleText={<ToggleText />} title={<Title />}>
        <p>Item 2 content</p>
      </Accordion.Item>
      <Accordion.Item value="3" toggleText={<ToggleText />} title={<Title />}>
        <p>Item 3 content</p>
      </Accordion.Item>
    </>
  ),
};
