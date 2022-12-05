import { Transition } from "@headlessui/react";
import MainActionButton from "components/MainActionButton";
import React, { useState } from "react";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";
import TertiaryActionButton from "./TertiaryActionButton";

type WindowWithDataLayer = Window & {
  dataLayer: Record<string, any>[];
};

declare const window: WindowWithDataLayer;

const GoogleAnalyticsPrompt = () => {
  const [openAnalyticsPrompt, setOpenAnalyticsPrompt] = useState(true);

  const handleAccept = () => {
    window.dataLayer.push({
      event: "pageView",
      url: window.location.pathname,
    });
    setOpenAnalyticsPrompt(false);
  };

  const handleDecline = () => {
    setOpenAnalyticsPrompt(false);
  };

  return (
    <Transition show={openAnalyticsPrompt}>
      <Transition.Child
        enter="transition ease-out duration-300 transform"
        enterFrom="opacity-0 translate-y-full"
        enterTo="opacity-100 translate-y-0"
        leave="transition transform ease-in duration-300"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-full"
      >
        <div className="bg-white w-full py-6 px-8 rounded-t-lg shadow-custom flex flex-col md:flex-row items-center justify-center space-y-6 md:space-y-0 md:space-x-10 fixed bottom-0 z-50">
          <p className="text-primaryDark">
            This site uses Google analytics to enhance your experience, understand site usage, <br /> and assist in
            creating a better experience.
          </p>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 w-full md:w-auto">
            <PrimaryButton handleClick={handleAccept}>Opt-in</PrimaryButton>
            <TertiaryActionButton label="Opt-out" handleClick={handleDecline} />
          </div>
        </div>
      </Transition.Child>
    </Transition>
  );
};

export default GoogleAnalyticsPrompt;
