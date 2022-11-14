import { formatAndRoundBigNumber } from "@popcorn/utils";
import { SweetVaultMetadata } from "@popcorn/utils/types";
import useStakingPool from "hooks/staking/useStakingPool";
import useSweetVault from "hooks/sweetvault/useSweetVault";
import React from "react";
import PortfolioProductItem from "../PortfolioProductItem";

const SweetVaultsItem = ({ address, chainId }) => {
  const { data: sweetVault } = useSweetVault(address, chainId);
  const metadata = sweetVault ? sweetVault.metadata : ({} as SweetVaultMetadata);
  const { name, underlyingToken, deposited, tvl, apy, curveLink, icon, displayText } = metadata;
  const { data: stakingPool } = useStakingPool(sweetVault?.metadata?.stakingAdress, chainId);
  const stakingApy = formatAndRoundBigNumber(stakingPool?.apy, 3);

  const apyInfoText = `This is the variable annual percentage rate. The shown vAPR comes from yield on the underlying assets (${
    apy?.toLocaleString() || "-"
  }%) and is boosted with POP (${
    stakingApy || "-"
  }%). You must stake your ${name} to receive the additional vAPR in POP. 90% of earned POP rewards are vested over one year.`;

  const tokenStatusLabels = [
    {
      content: `${formatAndRoundBigNumber(deposited, sweetVault?.metadata?.decimals)}`,
      // image?: React.ReactElement;
      label: "Deposited",
      infoIconProps: {
        id: `deposited-vaults-${chainId}`,
        title: "How we calculate the Deposited",
        content: "How we calculate the Deposited is lorem ipsum",
      },
      emissions: "200k POP",
    },
    {
      content: `${(apy + Number(stakingApy))?.toLocaleString() + "%"}`,
      // image?: React.ReactElement;
      label: "vAPR",
      infoIconProps: {
        id: `vapr-vaults-${chainId}`,
        title: "How we calculate the vAPR",
        content: apyInfoText,
      },
    },
    {
      content: `${formatAndRoundBigNumber(tvl, 18)}`,
      // image?: React.ReactElement;
      label: "TVL",
      infoIconProps: {
        id: `tvl-vaults-${chainId}`,
        title: "How we calculate the TVL",
        content: "How we calculate the Deposited is lorem ipsum",
      },
    },
    {
      content: `${formatAndRoundBigNumber(tvl, 18)}`,
      // image?: React.ReactElement;
      label: "TVL",
      infoIconProps: {
        id: `tvl-vaults-${chainId}`,
        title: "How we calculate the TVL",
        content: "How we calculate the Deposited is lorem ipsum",
      },
    },
  ];
  return (
    <PortfolioProductItem tokenName={name} tokenIcon={{ address, chainId }} tokenStatusLabels={tokenStatusLabels} />
  );
};

export default SweetVaultsItem;
