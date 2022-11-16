import { Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/outline";
import Badge from "@popcorn/app/components/Common/Badge";
import StatusWithLabel, { StatusWithLabelProps } from "@popcorn/app/components/Common/StatusWithLabel";
import React, { useState } from "react";

interface PortfolioItemProps {
  title: string;
  badge?: {
    text: string;
    textColor: string;
    bgColor: string;
  };
  statusLabels: Array<StatusWithLabelProps>;
  showExpandIcon?: boolean;
  show: boolean;
}
const PortfolioItem: React.FC<PortfolioItemProps> = ({
  title,
  statusLabels,
  badge,
  children,
  showExpandIcon = true,
  show,
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  return (
    <div
      className={`border-b border-customLightGray px-6 py-8 ${show ? "" : "hidden"}`}
      onClick={() => {
        setExpanded(!expanded);
      }}
    >
      <div className="flex justify-between">
        <div className="flex flex-col md:flex-row md:items-center">
          <h3 className="text-3xl md:text-4xl mb-2 md:mb-0 font-normal leading-9">{title}</h3>
          {
            <div className="md:pl-2">
              <Badge badge={badge} />
            </div>
          }
        </div>
        <ChevronDownIcon
          className={`${expanded ? "rotate-180" : "rotate-0"} ${showExpandIcon ? "" : "hidden"}
          transform transition-all ease-in-out w-6 text-secondaryLight cursor-pointer`}
        />
      </div>

      <div className="grid grid-cols-12 mt-10 mb-6">
        {statusLabels.map(({ content, label, infoIconProps, image }) => (
          <div className="col-span-12 md:col-span-3" key={infoIconProps.id}>
            {" "}
            <StatusWithLabel content={content} label={label} infoIconProps={infoIconProps} image={image} />
          </div>
        ))}
      </div>
      <Transition
        show={expanded}
        enter="translate transition duration-500 delay-200 ease-in"
        enterFrom="transform -translate-y-10 md:-translate-y-16 opacity-0"
        enterTo="transform translate-y-0 opacity-100"
        leave="translate transition duration-500 ease-out"
        leaveFrom="transform translate-y-0 opacity-100"
        leaveTo="transform -translate-y-10 md:-translate-y-16 opacity-0"
      >
        <div className="py-6">{children}</div>
      </Transition>
    </div>
  );
};

export default PortfolioItem;
