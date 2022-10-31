import { usePortfolio } from "context/PortfolioContext";
import { BigNumber } from "ethers/lib/ethers";
import { formatUnits } from "ethers/lib/utils";
import useNetWorth from "hooks/netWorth/useNetWorth";
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

  const calculatePercentage = useCallback((value: string) => {
    const total = networth.total ?? fallBackAmount;
    const current = netWorthValue?.[value] ?? fallBackAmount;
    console.log(current, "current");

    // const percentage = current.mul(100).div(total);
    // console.log("🚀 ~ file: NetWorthCard.tsx ~ line 22 ~ calculatePercentage ~ percentage", percentage)
    // return percentage;
  }, []);

  return (
    <div className="bg-warmGray rounded-lg p-6">
      <h6 className="font-medium">My Net Worth </h6>
      <p className=" text-[40px] mt-6 font-light">
        ${formatter.format(parseInt(formatUnits(netWorthValue?.total ?? fallBackAmount)))}
      </p>

      <div className="flex text-white text-xs my-6">
        <div className="bg-customLightPurple py-6 px-4 w-2/4 rounded-tl-5xl rounded-bl-5xl">50%</div>
        <div className="bg-customPurple py-6 px-2 w-1/4">25%</div>
        <div className="bg-customDarkPurple py-6 px-2 w-1/4 rounded-tr-5xl rounded-br-5xl">25%</div>
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
            <p>{calculatePercentage("deposit")}%</p>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center">
          <div className="bg-customLightPurple w-2 h-2 rounded-full"></div>
          <p className="text-customBrown ml-2 leading-6"> Vesting</p>
        </div>
        <div className="grid grid-cols-12 ml-4 mt-1">
          <div className="col-span-6">
            <p>${formatter.format(parseInt(formatUnits(netWorthValue?.vesting ?? fallBackAmount)))}</p>
          </div>
          <div className="col-span-6">
            <p>{calculatePercentage("vesting")}%</p>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center">
          <div className="bg-customLightPurple w-2 h-2 rounded-full"></div>
          <p className="text-customBrown ml-2 leading-6">In Wallet</p>
        </div>
        <div className="grid grid-cols-12 ml-4 mt-1">
          <div className="col-span-6">
            <p>${formatter.format(parseInt(formatUnits(netWorthValue?.inWallet ?? fallBackAmount)))}</p>
          </div>
          <div className="col-span-6">
            <p>{calculatePercentage("inWallet")}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetWorthCard;
