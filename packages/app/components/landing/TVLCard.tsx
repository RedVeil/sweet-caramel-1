import { ChainId } from "@popcorn/utils";
import { InfoIconWithTooltip } from "@popcorn/app/components/InfoIconWithTooltip";
import { constants } from "ethers/lib/ethers";
import { formatUnits } from "ethers/lib/utils";
import useSetTokenTVL from "@popcorn/app/hooks/set/useSetTokenTVL";
import useStakingTVL from "@popcorn/app/hooks/staking/useStakingTVL";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import { useMemo } from "react";

export function TVLCard(): JSX.Element {
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
    <div className="col-span-5 md:col-span-12 rounded-lg border border-customLightGray p-6">
      <div className="flex items-center gap-2 md:gap-0 md:space-x-2 mb-1 md:mb-2">
        <p className="text-primaryLight leading-5 hidden md:block">Total Value Locked </p>
        <p className="text-primaryLight leading-5 md:hidden">TVL </p>
        <InfoIconWithTooltip
          classExtras=""
          id="hero-tvl"
          title="Total value locked (TVL)"
          content="Total value locked (TVL) is the amount of user funds deposited in popcorn products."
        />
      </div>
      <p className="text-primary text-xl md:text-4xl leading-5 md:leading-8">
        ${formatter.format(parseInt(formatUnits(tvl)))}
      </p>
    </div>
  );
}
