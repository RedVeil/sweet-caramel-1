import { FeatureToggleContext } from "context/FeatureToggleContext";
import { NextRouter } from "next/router";
import { useContext, useMemo } from "react";

export interface ProductTypes {
  title: string;
  onClick: () => void;
  currentlySelected: boolean;
  url: string;
}

export default function getProducts(
  router: NextRouter,
  pushWithinChain: (url: string, shallow?: boolean) => Promise<boolean>,
) {
  const { features } = useContext(FeatureToggleContext);

  return useMemo(() => {
    return [
      {
        title: "3X",
        onClick: () => pushWithinChain(`/set/threex`),
        currentlySelected: router.pathname.includes("/threex"),
        url: "/set/threex",
      },
      {
        title: "Butter",
        onClick: () => pushWithinChain(`/set/butter`),
        // TODO: Should match the url only when not on threeX or Instant
        currentlySelected: router.pathname.includes("/set/butter"),
        url: "/set/butter",
      },
      {
        title: "Sweet Vaults",
        onClick: () => pushWithinChain(`/sweet-vaults`),
        currentlySelected: router.pathname.includes("/sweet-vaults"),
        url: "/sweet-vaults",
      },
    ].filter(product => features.sweetVaults ? true : product.title !== "Sweet Vaults")
  }, [router, router?.query?.network, features]);
}
