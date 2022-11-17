import classnames from "classnames";
import { usePortfolio } from "@popcorn/app/context/PortfolioContext";
import { BigNumber } from "ethers/lib/ethers";
import { formatUnits } from "ethers/lib/utils";
import useNetWorth from "@popcorn/app/hooks/netWorth/useNetWorth";
import { useCallback } from "react";

const NetWorthCard = () => {
  const formatter = Intl.NumberFormat("en", {
    //@ts-ignore
    notation: "compact",
  });
  const networth = useNetWorth();
  const { selectedNetwork } = usePortfolio();
  const netWorthValue = selectedNetwork.id === "All" ? networth.total : networth[selectedNetwork.id];
  const fallBackAmount = BigNumber.from("0");

  const calculatePercentage = useCallback(
    (value: string) => {
      const total = netWorthValue?.total ?? fallBackAmount;

      if (total.isZero()) return "0";

      const current = netWorthValue?.[value] ?? fallBackAmount;
      return current.mul(100).div(total).toString();
    },
    [netWorthValue],
  );

  const vestingPercentage = calculatePercentage("vesting");
  const depositPercentage = calculatePercentage("deposit");
  const inWalletPercentage = calculatePercentage("inWallet");

  return (
    <div className="bg-warmGray rounded-lg p-6">
      <h6 className="font-medium">My Net Worth </h6>
      <p className=" text-[40px] mt-6 font-light">
        ${formatter.format(parseInt(formatUnits(netWorthValue?.total ?? fallBackAmount)))}
      </p>

      <div className="flex text-white text-xs my-6 w-full">
        <div
          style={{ width: `${depositPercentage}%` }}
          className={classnames(`bg-customLightPurple py-6 px-4 rounded-tl-5xl rounded-bl-5xl`, {
            hidden: depositPercentage === "0",
            "rounded-br-5xl rounded-tr-5xl": vestingPercentage === "0",
          })}
        >
          <p>{depositPercentage}%</p>
        </div>
        <div
          style={{ width: `${vestingPercentage}%` }}
          className={classnames(`bg-customPurple py-6 px-2`, {
            hidden: vestingPercentage === "0",
            "rounded-bl-5xl rounded-tl-5xl": depositPercentage === "0",
            "rounded-br-5xl rounded-tr-5xl": inWalletPercentage === "0",
          })}
        >
          {vestingPercentage}%
        </div>
        <div
          style={{ width: `${inWalletPercentage}%` }}
          className={classnames(`bg-customDarkPurple py-6 px-2 rounded-tr-5xl rounded-br-5xl`, {
            hidden: inWalletPercentage === "0",
            "rounded-bl-5xl rounded-tl-5xl": vestingPercentage === "0",
          })}
        >
          {inWalletPercentage}%
        </div>
      </div>

      <div>
        <div className="flex items-center">
          <div className="bg-customLightPurple w-2 h-2 rounded-full"></div>
          <p className="text-customBrown ml-2 leading-6">Total Deposits</p>
        </div>
        <div className="grid grid-cols-12 ml-4 mt-1">
          <div className="col-span-6">
            <p>${formatter.format(parseInt(formatUnits(netWorthValue?.deposit ?? fallBackAmount)))}</p>
          </div>
          <div className="col-span-6">
            <p>{depositPercentage}%</p>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center">
          <div className="bg-customPurple w-2 h-2 rounded-full"></div>
          <p className="text-customBrown ml-2 leading-6"> Vesting</p>
        </div>
        <div className="grid grid-cols-12 ml-4 mt-1">
          <div className="col-span-6">
            <p>${formatter.format(parseInt(formatUnits(netWorthValue?.vesting ?? fallBackAmount)))}</p>
          </div>
          <div className="col-span-6">
            <p>{vestingPercentage}%</p>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center">
          <div className="bg-customDarkPurple w-2 h-2 rounded-full"></div>
          <p className="text-customBrown ml-2 leading-6">In Wallet</p>
        </div>
        <div className="grid grid-cols-12 ml-4 mt-1">
          <div className="col-span-6">
            <p>${formatter.format(parseInt(formatUnits(netWorthValue?.inWallet ?? fallBackAmount)))}</p>
          </div>
          <div className="col-span-6">
            <p>{inWalletPercentage}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetWorthCard;
