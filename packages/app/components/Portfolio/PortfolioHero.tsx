import { ChainId } from "@popcorn/utils";
import StatusWithLabel from "components/Common/StatusWithLabel";
import { constants } from "ethers/lib/ethers";
import { formatUnits } from "ethers/lib/utils";
import useSetTokenTVL from "hooks/set/useSetTokenTVL";
import useStakingTVL from "hooks/staking/useStakingTVL";
import { useDeployment } from "hooks/useDeployment";
import { useMemo } from "react";

const PortfolioHero = () => {
  const { Ethereum, Polygon } = ChainId;
  const eth = useDeployment(Ethereum);
  const { data: mainnetStakingTVL } = useStakingTVL(Ethereum);
  const { data: polygonStakingTVL } = useStakingTVL(Polygon);
  const { data: butterTVL } = useSetTokenTVL(eth.butter, eth.butterBatch, Ethereum);
  const { data: threeXTVL } = useSetTokenTVL(eth.threeX, eth.threeXBatch, Ethereum);
  const tvl = useMemo(
    () =>
      [mainnetStakingTVL, polygonStakingTVL, butterTVL, threeXTVL].reduce(
        (total, num) => total.add(num ? num : constants.Zero),
        constants.Zero,
      ),
    [mainnetStakingTVL, polygonStakingTVL, butterTVL, threeXTVL],
  );

  let formatter = Intl.NumberFormat("en", {
    //@ts-ignore
    notation: "compact",
  });
  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12 md:col-span-4">
        <h1 className="text-6xl leading-12">
          Your <br />
          Portfolio <br />
          Overview
        </h1>
        <p className="my-6 leading-5 text-primaryDark">
          A glance at your current Popcorn portfolio across different networks
        </p>
        <div className="flex">
          <StatusWithLabel
            content={`$${formatter.format(parseInt(formatUnits(tvl)))}`}
            label="Total Popcorn TVL"
            infoIconProps={{
              id: "portfolio-tvl",
              title: "Total value locked (TVL)",
              content: "Total value locked (TVL) is the amount of user funds deposited in popcorn products.",
            }}
          />
          <div className="bg-gray-300 h-16 hidden md:block mx-6" style={{ width: "1px" }}></div>
          <StatusWithLabel
            content={`Coming Soon`}
            label="Total Social Impact"
            infoIconProps={{
              id: "social-impact-id",
              title: "Total Social Impact",
              content: "This is how much we've spent making social impact.",
            }}
          />
        </div>
      </div>
      <div className="col-span-5 col-end-13 bg-customYellow rounded-lg md:block">
        <div className="w-full h-full flex justify-end items-end">
          <img src="/images/portfolio.svg" />
        </div>
      </div>
    </div>
  );
};

export default PortfolioHero;
