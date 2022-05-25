import { BeneficiaryImage } from "@popcorn/hardhat/lib/adapters";
import React from "react";

export interface CardBodyProps {
  image: BeneficiaryImage;
  name: String;
  missionStatement: String;
}

const CardBody: React.FC<CardBodyProps> = ({ image, name, missionStatement }) => {
  return (
    <div className="shadow-custom-lg bg-white rounded-3xl">
      <div>
        <img
          className="h-48 w-full object-cover rounded-t-3xl"
          src={image?.image}
          alt={image?.description || `Picture of ${name}`}
        />
      </div>
      <div className="h-40 bg-white py-8 px-6 flex flex-col justify-between rounded-b-3xl">
        <div className="h-full overflow-ellipsis overflow-hidden">
          <p className="text-2xl font-semibold text-gray-900">{name}</p>
          <p className="mt-3 text-base text-gray-500 font-light">{missionStatement}</p>
        </div>
      </div>
    </div>
  );
};
export default CardBody;
