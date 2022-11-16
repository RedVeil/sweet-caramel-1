import SecondaryActionButton from "@popcorn/app/components/SecondaryActionButton";
import Link from "next/link";
import React from "react";

interface EarnedRewardsButton {
  title: string;
  amount: string;
  buttonLabel: string;
  link: string;
}

const EarnedRewardsButton: React.FC<EarnedRewardsButton> = ({ title, amount, buttonLabel, link }) => {
  return (
    <div className=" rounded-lg md:border md:border-customLightGray px-0 pt-4 md:p-6 md:pb-0 mt-6 group" role="button">
      <p className=" text-primary leading-6 mb-2">{title}</p>
      <p className="text-primary text-2xl leading-6">${amount}</p>
      <div className="border md:border-0 md:border-t border-customLightGray rounded-lg md:rounded-none px-6 md:px-0  py-6 md:py-2 md:mt-4">
        <div>
          <Link href={link}>
            <a>
              <SecondaryActionButton label={buttonLabel} />
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EarnedRewardsButton;
