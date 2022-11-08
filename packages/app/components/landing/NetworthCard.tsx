import { InfoIconWithTooltip } from "components/InfoIconWithTooltip";
import { formatUnits } from "ethers/lib/utils";
import useNetWorth from "hooks/netWorth/useNetWorth";

export function NetworthCard(): JSX.Element {
  const { total } = useNetWorth();
  const formatter: Intl.NumberFormat = Intl.NumberFormat("en", {
    //@ts-ignore
    notation: "compact",
  });
  return (
    <div className="col-span-7 md:col-span-12 rounded-lg border border-customLightGray p-6 md:my-8">
      <div className="flex items-center gap-2 md:gap-0 md:space-x-2 mb-1 md:mb-2">
        <p className="text-primaryLight leading-5 hidden md:block">My Net Worth</p>
        <p className="text-primaryLight leading-5 md:hidden">MNW</p>
        <InfoIconWithTooltip
          classExtras=""
          id="hero-mnw"
          title="Net Worth"
          content="This value aggregates your Popcorn-related holdings across all blockchain networks."
        />
      </div>
      <p className="text-primary text-xl md:text-4xl leading-5 md:leading-8">
        ${formatter.format(parseInt(formatUnits(total.total)))}
      </p>
    </div>
  );
}
