import { NextRouter } from "next/router";
import { useMemo } from "react";

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
  return useMemo(() => {
    return [
      {
        title: "Butter",
        onClick: () => pushWithinChain(`/butter`),
        // TODO: Should match the url only when not on threeX or Instant
        currentlySelected: router.pathname.includes("/butter"),
        url: "/butter",
      },
      {
        title: "3X",
        onClick: () => pushWithinChain(`/butter/threex`),
        currentlySelected: router.pathname.includes("/butter/threex"),
        url: "/butter/threex",
      },
    ];
  }, [router, router?.query?.network]);
}
