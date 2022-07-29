import React from "react";
import ReactTooltip from "react-tooltip";

export interface InfoIconWithTooltipProps {
  title?: string;
  content: string | React.ReactElement;
  id?: string;
  classExtras?: string;
}

export const InfoIconWithTooltip: React.FC<InfoIconWithTooltipProps> = ({ title, content, id, classExtras }) => {
  return (
    <div className="inline">
      <img
        src="/images/icons/tooltip.svg"
        data-tip
        data-for={id}
        className={`inline-flex items-center border border-transparent rounded-full shadow-custom hover:bg-blue-200 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer ${classExtras}`}
      />
      <ReactTooltip
        id={id}
        place={"bottom"}
        effect="solid"
        type="info"
        className="shadow-lg rounded-lg border-2 border-dropdownBorder w-60"
        backgroundColor="#fff"
        borderColor="rgba(229, 231, 235, var(--tw-border-opacity))"
        data-html="true"
        border
        delayHide={500}
        getContent={() => (
          <div className="text-black text-base leading-7">
            <h6 className="mb-1">{title}:</h6>
            <p className="text-primaryDark">{content}</p>
          </div>
        )}
      />
    </div>
  );
};
