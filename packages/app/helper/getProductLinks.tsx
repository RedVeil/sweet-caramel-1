import { FeatureToggleContext } from "@popcorn/app/context/FeatureToggleContext";
import { NextRouter } from "next/router";
import { useContext, useMemo } from "react";

interface ProductLinks {
  title: string;
  onClick: () => void;
  currentlySelected: boolean;
  url: string;
}

export function getProductLinks(
  router: NextRouter,
  pushWithinChain: (url: string, shallow?: boolean) => Promise<boolean>,
): ProductLinks[] {
  const { features } = useContext(FeatureToggleContext);

  return useMemo(() => {
    return [
      {
        title: "3X",
        onClick: () => pushWithinChain(`/set/3x`),
        currentlySelected: router.pathname.includes("/3x"),
        url: "/set/3x",
      },
      {
        title: "Butter",
        onClick: () => pushWithinChain(`/set/butter`),
        currentlySelected: router.pathname.includes("/set/butter"),
        url: "/set/butter",
      },
      {
        title: "Sweet Vaults",
        onClick: () => pushWithinChain(`/sweet-vaults`),
        currentlySelected: router.pathname.includes("/sweet-vaults"),
        url: "/sweet-vaults",
      },
      {
        title: "Staking",
        onClick: () => pushWithinChain(`/staking`),
        currentlySelected: router.pathname.includes("/staking"),
        url: "/staking",
      },
    ].filter(product => features.sweetVaults ? true : product.title !== "Sweet Vaults")
  }, [router, router?.query?.network, features]);
}
