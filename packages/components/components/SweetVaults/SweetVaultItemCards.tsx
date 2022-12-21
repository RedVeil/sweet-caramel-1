import React from "react";
import InfoCard from "./InfoCard";
import SweetVaultsForm from "./SweetVaultsForm";
import SecondaryActionButton from "@popcorn/app/components/SecondaryActionButton";

const SweetVaultItemCards = ({ sweetVaultFormProps, infoCardProps }) => {
  return (
    <div className="grid grid-cols-12 gap-8 mt-8">
      <div className="col-span-12 md:col-span-4">
        <SweetVaultsForm {...sweetVaultFormProps} />
        <div className="rounded-lg border border-customLightGray bg-white p-4 mt-8">
          <SecondaryActionButton label={<span className="font-normal">Get token</span>} />
        </div>
      </div>

      <div className="col-span-12 md:col-span-8">
        <InfoCard {...infoCardProps} />
      </div>
    </div>
  );
};

export default SweetVaultItemCards;
