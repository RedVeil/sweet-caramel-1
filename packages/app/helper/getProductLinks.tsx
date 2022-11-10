import { FeatureToggleContext } from "@popcorn/app/context/FeatureToggleContext";
import { NextRouter } from "next/router";
import { useContext, useMemo } from "react";
import usePushWithinChain from "@popcorn/app/hooks/usePushWithinChain";
import { useChainUrl } from "@popcorn/app/hooks/useChainUrl";
import { useNetwork } from "wagmi";

interface ProductLinks {
  title: string;
  onClick: () => void;
  currentlySelected: boolean;
  url: string;
}

export function getProductLinks(router: NextRouter): ProductLinks[] {
  const { features } = useContext(FeatureToggleContext);
  const pushWithinChain = usePushWithinChain();
  const { chain } = useNetwork();
  const url = useChainUrl();

  return useMemo(() => {
    return [
      {
        title: "3X",
        onClick: () => pushWithinChain(`set/3x`),
        currentlySelected: router.pathname.includes("/3x"),
        url: url("/set/3x"),
      },
      {
        title: "Butter",
        onClick: () => pushWithinChain(`set/butter`),
        currentlySelected: router.pathname.includes("/set/butter"),
        url: url("/set/butter"),
      },
      {
        title: "Sweet Vaults",
        onClick: () => `/sweet-vaults`,
        currentlySelected: router.pathname.includes("/sweet-vaults"),
        url: "/sweet-vaults",
      },
      {
        title: "Staking",
        onClick: () => router?.push(`/staking`),
        currentlySelected: router.pathname.includes("/staking"),
        url: "/staking",
      },
    ].filter((product) => (features.sweetVaults ? true : product.title !== "Sweet Vaults"));
  }, [router, router?.query?.network, features, chain?.id]);
}
