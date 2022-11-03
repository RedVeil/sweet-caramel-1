import { useRouter } from "next/router";
import { useCallback } from "react";

export default function usePushWithinChain(): (url: string, shallow?: boolean) => void {
  const router = useRouter();

  return useCallback(
    (url: string, shallow = false) => { // Remove a leading dash if someone added it by accident
      if (url[0] === "/") {
        url = url.slice(1, url.length)
      }

      router.push({ pathname: `/${router?.query?.network}/${url}` },
        undefined,
        { shallow: shallow }
      )
    },
    [router?.query?.network],
  );
}