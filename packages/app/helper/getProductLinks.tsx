import { NextRouter } from "next/router";
import { useMemo } from "react";

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
  return useMemo(() => {
    return [
      {
        title: "Butter",
        onClick: () => pushWithinChain(`/set/butter`),
        currentlySelected: router.pathname.includes("/set/butter"),
        url: "/set/butter",
      },
      {
        title: "3X",
        onClick: () => pushWithinChain(`/set/3x`),
        currentlySelected: router.pathname.includes("/set/3x"),
        url: "/set/threex",
      },
      {
        title: "Staking",
        onClick: () => pushWithinChain(`/staking`),
        currentlySelected: router.pathname.includes("/staking"),
        url: "/staking",
      },
    ];
  }, [router, router?.query?.network]);
}
