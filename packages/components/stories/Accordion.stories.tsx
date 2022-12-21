import { ComponentStory, ComponentMeta } from "@storybook/react";
import { Accordion, AccordionVariant } from "../components/Accordion";
import SweetVaultItemCards from "../components/SweetVaults/SweetVaultItemCards";
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
const TokenInput = () => {
  return (
    <>
      <label htmlFor="tokenInput" className="font-medium text-gray-700 w-full mb-2">
        <p className="font-medium text-primary">Deposit Amount</p>
      </label>
      <div className="relative flex items-center px-5 py-2 border border-customLightGray rounded-lg">
        <input
          type="text"
          name=""
          id=""
          className={`block w-full p-0 border-0 text-primaryDark text-lg focus:ring-0`}
        />
      </div>
    </>
  );
};

const SweetVaultItemCardsProps = {
  sweetVaultFormProps: {
    submitForm: () => console.log("test"),
    // Replace the TokenInput component with the actual Token input component form @popcorn/app
    TokenInput: <TokenInput />,
  },
  infoCardProps: {
    title: "USDT",
    tokenImage: ETHIcon,
    infoList: [
      { infoItem: <span> USDT is a USD-pegged stablecoin-backed 1:1 with the dollar.</span> },
      { infoItem: <span> Collateral: Cash and cash equivalents. </span> },
      {
        infoItem: (
          <span>
            {" "}
            Collateral Ratio: ~100%{" "}
            <a href="" className="text-customPurple">
              (source)
            </a>{" "}
          </span>
        ),
      },
      {
        infoItem: (
          <span>
            {" "}
            Audits:{" "}
            <a href="" className="text-customPurple">
              Reports and reserves
            </a>{" "}
          </span>
        ),
      },
      { infoItem: <span> Founders: Aaron MacGregor (CEO), Craig Sellars, Reeve Collins, and Brock Pierce. </span> },
      {
        infoItem: (
          <span>
            {" "}
            Disclaimer: Not all of Tether’s reserves are liquid as indicated by the{" "}
            <a href="" className="text-customPurple">
              reserve breakdown
            </a>{" "}
            and given significant redemption demand, this may affect USDT’s ability to maintain its USD peg.
          </span>
        ),
      },
    ],

    strategies: [
      {
        title: "Aave Optimizer",
        content:
          "Deposits USDT into AAVE to earn stkAAVE. Once stkAAVE unlocks it is then harvested and sold for more USDT which is deposited back into the strategy.",
      },
      {
        title: "Stargate Finance Optimizer",
        content: (
          <span>
            {" "}
            Deposit USDT into{" "}
            <a href="" className="text-customPurple">
              {" "}
              Stargate Finance
            </a>{" "}
            to earn STG. Earned tokens are harvested and sold for more USDT which is deposited back into the strategy.
          </span>
        ),
      },
      {
        title: "Idle Finance Optimizer",
        content: (
          <span>
            {" "}
            Deposits USDT int{" "}
            <a href="" className="text-customPurple">
              {" "}
              Idle Finance
            </a>{" "}
            to earn IDLE and COMP. Earned tokens are harvested and sold for more USDT which is deposited back into the
            strategy.
          </span>
        ),
      },
    ],
  },
};

SweetVaults.args = {
  variant: AccordionVariant.Default,
  children: (
    <>
      <Accordion.Item value="1" toggleText={<ToggleText />} title={<Title />}>
        <SweetVaultItemCards {...SweetVaultItemCardsProps} />
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
