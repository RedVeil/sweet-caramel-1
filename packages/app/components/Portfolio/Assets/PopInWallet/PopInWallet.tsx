import { ChainId, formatAndRoundBigNumber, networkLogos, networkMap } from "@popcorn/utils";
import usePopInWallet from "hooks/portfolio/assets/usePopInWallet";
import PortfolioItem from "../../PortfolioItem";

const PopInWallet = () => {
  const { totalValue, totalPop } = usePopInWallet();
  const { Ethereum, Polygon } = ChainId;

  const statusLabels = [
    {
      content: `$${formatAndRoundBigNumber(totalPop, 18)}`,
      label: "Total value",
      infoIconProps: {
        id: "staking-tvl",
        title: "Total Value",
        content:
          "Every time you claim rewards a new 'Vesting Record' below will be added. Rewards in each 'Vesting Record' unlock over time. Come back periodically to claim new rewards as they unlock.",
      },
    },
    {
      image: <img src="/images/icons/POP.svg" alt="pop=logo" className="h-8 w-8 object-contain" />,
      label: "Assets",
      infoIconProps: {
        id: "total-claimable",
        title: "Total Claimable",
        content:
          "This describes the total amount of Rewards that you can currently claim across all 'Vesting Records'.",
      },
    },
    {
      image: (
        <div className="flex items-center space-x-2">
          <img src={networkLogos[Ethereum]} alt={`${networkMap[Ethereum]}-logo`} className="h-5 w-5 object-contain" />
          <img src={networkLogos[Polygon]} alt={`${networkMap[Polygon]}-logo`} className="h-5 w-5 object-contain" />
        </div>
      ),
      label: "Network",
      infoIconProps: {
        id: "arrakis-network",
        title: "How we calculate the Deposited",
        content: "Your current selected Network",
      },
    },
  ];

  return (
    <>
      <PortfolioItem title="POP In Wallet" statusLabels={statusLabels} showExpandIcon={false}></PortfolioItem>
    </>
  );
};

export default PopInWallet;
