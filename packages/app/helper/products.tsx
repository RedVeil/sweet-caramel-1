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
        // TODO: Should match the url only when not on fourX or Instant
        currentlySelected: router.pathname.includes("/butter"),
        url: "/butter",
      },
      {
        title: "4X",
        onClick: () => pushWithinChain(`/butter/fourx`),
        currentlySelected: router.pathname.includes("/butter/fourx"),
        url: "/butter/fourx",
      },
    ];
  }, [router, router?.query?.network]);
}
