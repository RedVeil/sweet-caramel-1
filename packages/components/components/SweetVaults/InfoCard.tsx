import React from "react";

interface InfoCardProps {
  title: string;
  tokenImage: string;
  infoList: Array<{ infoItem: JSX.Element }>;
  strategies: Array<{ title: string; content: string | JSX.Element }>;
}
const InfoCard = ({ tokenImage, title, infoList, strategies }) => {
  return (
    <div className=" rounded-lg border border-customLightGray p-8">
      <div className="flex items-center">
        <img src={tokenImage} alt={`${title}-token-image`} className="w-10 h-10" />
        <h1 className=" font-medium text-3xl">{title}</h1>
      </div>
      <div className="grid grid-cols-12 mt-16 gap-14">
        <div className="col-span-6">
          <ul className="list-disc pl-4 text-primaryDark space-y-4">
            {infoList.map((item, index) => (
              <li key={index}>{item.infoItem}</li>
            ))}
          </ul>
        </div>

        <div className="col-span-6">
          <h4 className=" text-2xl leading-9 mb-6">Strategies</h4>
          <div>
            {strategies.map((item, index) => (
              <div key={index} className="mb-4">
                {" "}
                <h6 className=" text-lg leading-7">{item.title}</h6>{" "}
                <p className="text-base text-primaryDark">{item.content}</p>{" "}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoCard;
