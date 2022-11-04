import ReactTooltip from "rc-tooltip";
import React from "react";
// TODO killed css here
export interface InfoIconWithTooltipProps {
  title?: string;
  content: string | JSX.Element;
  id?: string;
  classExtras?: string;
}

export const InfoIconWithTooltip: React.FC<InfoIconWithTooltipProps> = ({ title, content, id, classExtras }) => {
  return (
    // shadow-lg rounded-lg border-2 border-customLightGray
    <ReactTooltip
      id={id}
      placement={"bottom"}
      overlayClassName=" w-60"
      data-html="true"
      overlay={
        <div className="text-black text-base leading-7">
          <h6 className="mb-1">{title}:</h6>
          <p className="text-primaryDark">{content}</p>
        </div>
      }
    >
      <div className="flex items-center">
        <img
          src="/images/icons/tooltip.svg"
          data-tip
          data-for={id}
          className={`cursor-pointer w-4 laptop:w-auto ${classExtras}`}
        />
      </div>
    </ReactTooltip>
  );
};
