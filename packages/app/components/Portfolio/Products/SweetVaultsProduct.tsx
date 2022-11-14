import { ChainId } from "@popcorn/utils";
import { useSweetVaults } from "hooks/useSweetVaults";
import PortfolioItem from "../PortfolioItem";
import SweetVaultsItem from "./SweetVaultsItem";

const SweetVaultsProduct = () => {
  let formatter = Intl.NumberFormat("en", {
    //@ts-ignore
    notation: "compact",
  });

  const { Ethereum } = ChainId;
  const sweetVaults = useSweetVaults(Ethereum);

  const totalContracts = 1;

  const totalDeposited = "0";

  const totalTVL = "0";

  const totalVAPR = "0";

  const badge = {
    text: `${totalContracts} contracts`,
    textColor: "text-black",
    bgColor: "bg-customYellow",
  };

  const statusLabels = [
    {
      content: `$${totalTVL}`,
      label: "TVL",
      infoIconProps: {
        id: "staking-tvl",
        title: "How we calculate the TVL",
        content: "How we calculate the TVL is lorem ipsum",
      },
    },
    {
      content: `${totalVAPR}%`,
      label: "vAPR",
      infoIconProps: {
        id: "staking-vAPR",
        title: "How we calculate the vAPR",
        content: "How we calculate the vAPR is lorem ipsum",
      },
    },
    {
      content: `$${totalDeposited}`,
      label: "Deposited",
      infoIconProps: {
        id: "staking-deposited",
        title: "How we calculate the Deposited",
        content: "How we calculate the Deposited is lorem ipsum",
      },
    },
  ];

  return (
    <>
      <PortfolioItem title="Sweet Vaults" statusLabels={statusLabels} badge={badge} show={totalContracts > 0}>
        {sweetVaults.map((vault) => (
          <SweetVaultsItem address={vault} chainId={Ethereum} />
        ))}
      </PortfolioItem>
    </>
  );
};

export default SweetVaultsProduct;
