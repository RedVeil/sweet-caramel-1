import React from "react";
import ReactTooltip from "react-tooltip";

export interface InfoIconWithTooltipProps {
  title?: string;
  content: string;
  size?: string;
  id?: string;
}

export const InfoIconWithTooltip: React.FC<InfoIconWithTooltipProps> = ({ title, content, size = "h-7 w-7", id }) => {
  return (
    <div className="inline">
      <img
        src="/images/infoIcon.svg"
        data-tip
        data-for={id}
        className={`ml-5 inline-flex items-center p-1 mb-1.5 border border-transparent rounded-full shadow-sm text-gray-500 hover:bg-blue-200 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer ${size}`}
      />
      <ReactTooltip
        id={id}
        place={"bottom"}
        effect="solid"
        type="info"
        className="shadow-lg bg-gray-200 border-2 border-gray-200 p-1 w-60"
        backgroundColor="#F3F4F6"
        borderColor="rgba(229, 231, 235, var(--tw-border-opacity))"
        data-html="true"
        border
        delayHide={500}
        getContent={() => (
          <p className="text-center text-gray-900">
            <b>{title}:</b> {content}
          </p>
        )}
      />
    </div>
  );
};
