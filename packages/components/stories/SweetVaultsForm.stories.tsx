import React from "react";
import { ComponentStory, ComponentMeta } from "@storybook/react";
import SweetVaultsForm from "../components/SweetVaults/SweetVaultsForm";
import ETHIcon from "./assets/ethereum.svg";

export default {
  title: "Components/SweetVaultsForm",
  component: SweetVaultsForm,
} as ComponentMeta<typeof SweetVaultsForm>;

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

const Template: ComponentStory<typeof SweetVaultsForm> = (args) => (
  <div className="grid grid-cols-12">
    <div className="col-span-6">
      <SweetVaultsForm {...args} />
    </div>
  </div>
);

export const Primary = Template.bind({});
Primary.args = {
  submitForm: () => console.log("test"),
  // Replace the TokenInput component with the actual Token input component form @popcorn/app
  TokenInput: <TokenInput />,
};
