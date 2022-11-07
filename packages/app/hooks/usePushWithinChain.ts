import { useRouter } from "next/router";
import { useCallback } from "react";
import { useNetwork } from "wagmi";

export default function usePushWithinChain(): (url: string, shallow?: boolean) => void {
  const router = useRouter();
  const { chain } = useNetwork();

  const chainUrl = (name?: string) => {
    name = name?.toLowerCase().replace(" ", "-");

    switch (name?.toLowerCase()) {
      case "arbitrum-one":
        return "arbitrum";
      default:
        return name;
    }
  };

  return useCallback(
    (url: string, shallow = false) => {
      // Remove a leading dash if someone added it by accident
      if (url[0] === "/") {
        url = url.slice(1, url.length);
      }

      router.push({ pathname: `/${router?.query?.network || chainUrl(chain?.name) || "ethereum"}/${url}` }, undefined, {
        shallow: shallow,
      });
    },
    [router?.query?.network, chain?.name],
  );
}
