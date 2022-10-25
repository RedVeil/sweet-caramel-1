import React from "react";

interface PortfolioCardCon {
  cardTitle: string;
}
const PortfolioCardCon = ({ cardTitle, children }) => {
  return (
    <div className=" mb-[120px]">
      <p className=" font-medium leading-4 pb-4 border-b border-customLightGray">{cardTitle}</p>
      {children}
    </div>
  );
};

export default PortfolioCardCon;
